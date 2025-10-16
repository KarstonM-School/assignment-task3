import React, { useEffect, useRef, useState, useContext } from "react";
import { View, Text, Image, StyleSheet, Alert } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Feather } from "@expo/vector-icons";
import { RectButton } from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import customMapStyle from "../../map-style.json";
import * as MapSettings from "../constants/MapSettings";
import { AuthenticationContext } from "../context/AuthenticationContext";
import mapMarkerImg from "../images/map-marker.png";
import { API_BASE, EVENTS_CACHE_KEY } from "../constants/Api";
import { Event } from "../types/Event";

export default function EventsMap({ navigation }: any) {
  const authenticationContext = useContext(AuthenticationContext);
  const mapViewRef = useRef<MapView>(null);
  const [events, setEvents] = useState<Event[]>([]);

  // ---- Fetch events from API or cache ----
  const fetchEvents = async () => {
    try {
      const state = await NetInfo.fetch();
      const isConnected = state.isConnected;

      if (isConnected) {
        const response = await fetch(`${API_BASE}/events`);
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        const futureEvents = data.filter((e: Event) => new Date(e.dateTime).getTime() >= Date.now());
        setEvents(futureEvents);
        await AsyncStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(futureEvents));
      } else {
        const cached = await AsyncStorage.getItem(EVENTS_CACHE_KEY);
        if (cached) {
          setEvents(JSON.parse(cached));
        } else {
          Alert.alert("Offline", "No cached events available.");
        }
      }
    } catch (err) {
      console.warn(err);
      const cached = await AsyncStorage.getItem(EVENTS_CACHE_KEY);
      if (cached) {
        setEvents(JSON.parse(cached));
      } else {
        Alert.alert("Error", "Unable to load events.");
      }
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", fetchEvents);
    fetchEvents();
    return unsubscribe;
  }, [navigation]);

  const handleLogout = async () => {
    AsyncStorage.multiRemove(["userInfo", "accessToken"]).then(() => {
      authenticationContext?.setValue(undefined);
      navigation.navigate("Login");
    });
  };

  const handleNavigateToAddEventMap = () => {
    navigation.navigate("AddEventMap");
  };

  const handleNavigateToEventDetails = (eventId: string) => {
    navigation.navigate("EventDetails", { eventId });
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapViewRef}
        provider={PROVIDER_GOOGLE}
        initialRegion={MapSettings.DEFAULT_REGION}
        style={styles.mapStyle}
        customMapStyle={customMapStyle}
        showsMyLocationButton={false}
        showsUserLocation={true}
        rotateEnabled={false}
        toolbarEnabled={false}
        moveOnMarkerPress={false}
        mapPadding={MapSettings.EDGE_PADDING}
        onLayout={() =>
          mapViewRef.current?.fitToCoordinates(
            events.map((e) => ({
              latitude: e.position.latitude,
              longitude: e.position.longitude,
            })),
            { edgePadding: MapSettings.EDGE_PADDING }
          )
        }
      >
        {events.map((event) => (
          <Marker key={event.id} coordinate={event.position} onPress={() => handleNavigateToEventDetails(event.id)}>
            <Image resizeMode="contain" style={{ width: 48, height: 54 }} source={mapMarkerImg} />
          </Marker>
        ))}
      </MapView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {events.length} upcoming event{events.length !== 1 ? "s" : ""}
        </Text>
        <RectButton style={[styles.smallButton, { backgroundColor: "#00A3FF" }]} onPress={handleNavigateToAddEventMap}>
          <Feather name="plus" size={20} color="#FFF" />
        </RectButton>
      </View>

      <RectButton
        style={[styles.logoutButton, styles.smallButton, { backgroundColor: "#4D6F80" }]}
        onPress={handleLogout}
      >
        <Feather name="log-out" size={20} color="#FFF" />
      </RectButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, flex: 1, justifyContent: "flex-end", alignItems: "center" },
  mapStyle: { ...StyleSheet.absoluteFillObject },
  logoutButton: { position: "absolute", top: 70, right: 24, elevation: 3 },
  footer: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 40,
    backgroundColor: "#FFF",
    borderRadius: 16,
    height: 56,
    paddingLeft: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 3,
  },
  footerText: { color: "#8fa7b3", fontWeight: "700" },
  smallButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
});
