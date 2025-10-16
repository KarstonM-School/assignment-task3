import React, { useRef, useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import { RectButton } from "react-native-gesture-handler";
import MapView, { Marker, MapPressEvent, PROVIDER_GOOGLE } from "react-native-maps";
import * as MapSettings from "../constants/MapSettings";

export default function AddEventMap({ navigation }: any) {
  const mapRef = useRef<MapView>(null);
  const [position, setPosition] = useState<{ latitude: number; longitude: number } | null>(null);

  const onPressMap = (e: MapPressEvent) => setPosition(e.nativeEvent.coordinate);

  const onNext = () => {
    if (!position) return;
    navigation.navigate("AddEventForm", { position });
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        initialRegion={MapSettings.DEFAULT_REGION}
        style={styles.map}
        onPress={onPressMap}
        mapPadding={MapSettings.EDGE_PADDING}
        toolbarEnabled={false}
        rotateEnabled={false}
      >
        {position && <Marker coordinate={position} />}
      </MapView>

      <View style={styles.footer}>
        <RectButton enabled={!!position} style={[styles.nextBtn, !position && { opacity: 0.5 }]} onPress={onNext}>
          <Text style={styles.nextText}>Next</Text>
        </RectButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject },
  map: { ...StyleSheet.absoluteFillObject },
  footer: { position: "absolute", left: 24, right: 24, bottom: 40 },
  nextBtn: { backgroundColor: "#00A3FF", height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  nextText: { color: "#FFF", fontWeight: "700" },
});
