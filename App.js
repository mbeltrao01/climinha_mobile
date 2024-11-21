import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import * as Location from 'expo-location';

export default function App() {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(null); 
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);

  const apiKey = 'Inserir API-Key do open Weather aqui'; 

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Não foi possível acessar a localização.');
        return;
      }

      const initialLocation = await Location.getCurrentPositionAsync({});
      setLocation(initialLocation.coords);

      const [initialAddress] = await Location.reverseGeocodeAsync(initialLocation.coords);
      setAddress(initialAddress.city || initialAddress.region || 'Localização desconhecida');
    })();

    
    const locationSubscription = Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000, 
        distanceInterval: 10,
      },
      async (newLocation) => {
        setLocation(newLocation.coords);

        const [newAddress] = await Location.reverseGeocodeAsync(newLocation.coords);
        setAddress(newAddress.city || newAddress.region || 'Localização desconhecida');
      }
    );

    return () => {
      locationSubscription.remove();
    };
  }, []);

  const fetchWeather = async () => {
    if (!location) {
      Alert.alert('Erro', 'Localização não disponível');
      return;
    }

    setLoading(true);
    try {
      const { latitude, longitude } = location;
      const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
        params: {
          lat: latitude,
          lon: longitude,
          appid: apiKey,
          units: 'metric',
        },
      });

      setWeather(response.data);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível obter os dados do clima');
    } finally {
      setLoading(false);
    }
  };

    const translateWeatherCondition = (condition) => {
    const weatherConditions = {
      'clear sky': 'Céu limpo',
      'few clouds': 'Poucas nuvens',
      'scattered clouds': 'Nuvens dispersas',
      'broken clouds': 'Nuvens fragmentadas',
      'shower rain': 'Chuva rápida',
      'rain': 'Chuva',
      'thunderstorm': 'Tempestade',
      'snow': 'Neve',
      'mist': 'Névoa',
    };

    return weatherConditions[condition] || condition;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Climinha</Text>

      {/* Exibe o nome da localização */}
      {address && <Text style={styles.location}>Localização Atual: {address}</Text>}
      
      {loading ? (
        <ActivityIndicator size="large" color="#000000" />
      ) : weather ? (
        <View style={styles.weatherInfo}>
          <Text style={styles.infoText}>Temperatura: {weather.main.temp}°C</Text>
          <Text style={styles.infoText}>Condição: {translateWeatherCondition(weather.weather[0].description)}</Text>
          <Text style={styles.infoText}>Vento: {weather.wind.speed} m/s</Text>
        </View>
      ) : (
        <Text style={styles.infoText}>Buscando dados...</Text>
      )}

      <Button title="Buscar Clima" onPress={fetchWeather} disabled={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  location: {
    fontSize: 18,
    color: '#000000',
    marginBottom: 10,
    fontStyle: 'bold',
  },
  weatherInfo: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#b3dee5',
    borderRadius: 5,
    width: '100%',
  },
  infoText: {
    fontSize: 18,
    color: '#000000',
    marginBottom: 5,
  },
});
