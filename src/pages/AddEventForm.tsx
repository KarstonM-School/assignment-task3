import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TextInput, Alert, Image, Platform } from "react-native";
import { RectButton } from "react-native-gesture-handler";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { API_BASE } from "../constants/Api";
import { uploadImage } from "../services/imageApi";

export default function AddEventForm({ route, navigation }: any) {
  const { position } = route.params || {};
  const [name, setName] = useState("");
  const [about, setAbout] = useState("");
  const [volNeeded, setVolNeeded] = useState("");
  const [date, setDate] = useState<Date | null>(null);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [imagePreviewUri, setImagePreviewUri] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<{ name: string; sizeKB: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Validation
  const isVolunteersValid = useMemo(() => {
    const num = Number(volNeeded);
    return !isNaN(num) && num > 0 && Number.isInteger(num);
  }, [volNeeded]);

  const isDateValid = useMemo(() => date && date.getTime() >= Date.now(), [date]);
  const isDescriptionValid = about.length <= 300;

  const allValid = useMemo(
    () => !!name && isDescriptionValid && isVolunteersValid && isDateValid && !!imageUrl && !!date,
    [name, isDescriptionValid, isVolunteersValid, isDateValid, imageUrl, date]
  );

  // Permissions + Image picking + Uploading
  const ensurePermissions = async () => {
    const cam = await ImagePicker.requestCameraPermissionsAsync();
    const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (cam.status !== "granted" || lib.status !== "granted") {
      Alert.alert("Permissions required", "Camera and photo library permissions are needed.");
      return false;
    }
    return true;
  };

  const getFileNameFromUri = (uri: string) => {
    try {
      const parts = uri.split(/[\\/]/);
      return parts[parts.length - 1] || "selected_image.jpg";
    } catch {
      return "selected_image.jpg";
    }
  };

  const handleImagePicked = async (asset: any) => {
    try {
      setUploading(true);
      setImagePreviewUri(asset.uri);

      // get file info
      const info = await FileSystem.getInfoAsync(asset.uri);
      const sizeKB =
        info && typeof (info as any).size === "number" ? Number(((info as any).size / 1024).toFixed(2)) : 0;
      const name = asset.fileName ?? getFileNameFromUri(asset.uri);

      let base64: string | undefined = asset.base64;
      if (base64 && base64.includes(",")) {
        base64 = base64.split(",").pop();
      }
      if (!base64) {
        base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: "base64" as any });
      }

      const res = await uploadImage(base64);
      const url = res?.data?.data?.url;
      if (!url) throw new Error("No URL returned");

      setImageUrl(url);
      setImageMeta({ name, sizeKB });
    } catch {
      Alert.alert("Upload failed", "Could not upload image.");
      setImageUrl(null);
      setImageMeta(null);
    } finally {
      setUploading(false);
    }
  };

  const pickImage = async () => {
    if (!(await ensurePermissions())) return;
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
    });
    if (!r.canceled && r.assets?.length) await handleImagePicked(r.assets[0]);
  };

  const takePhoto = async () => {
    if (!(await ensurePermissions())) return;
    const r = await ImagePicker.launchCameraAsync({ base64: true });
    if (!r.canceled && r.assets?.length) await handleImagePicked(r.assets[0]);
  };

  // Date + Time
  const onChangeDate = (e: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selected) {
      const newDate = new Date(selected);
      setTempDate(newDate);
      if (Platform.OS === "android") setTimeout(() => setShowTimePicker(true), 0);
    }
  };

  const onChangeTime = (e: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") setShowTimePicker(false);
    if (selected) {
      const withTime = new Date(tempDate);
      withTime.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      setDate(withTime);
    }
  };

  // Save
  const onSave = async () => {
    if (!allValid || !date) {
      Alert.alert("Validation", "Please fill out all fields correctly before saving.");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: about,
          organizerId: "ImAdmin",
          dateTime: date.toISOString(),
          imageUrl,
          position,
          volunteersNeeded: Number(volNeeded),
          volunteersIds: [],
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      Alert.alert("Success", "Event created successfully!");
      navigation.navigate("EventsMap");
    } catch {
      Alert.alert("Error", "Could not save event.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Add Event</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Event Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Event name" />

        <Text style={styles.label}>About ({about.length}/300)</Text>
        <TextInput
          style={[styles.input, { height: 100 }]}
          value={about}
          onChangeText={setAbout}
          multiline
          maxLength={300}
          placeholder="Describe the event..."
        />

        <Text style={styles.label}>Volunteers Needed</Text>
        <TextInput
          style={[styles.input, !isVolunteersValid && { borderColor: "red", borderWidth: 1 }]}
          value={volNeeded}
          onChangeText={setVolNeeded}
          keyboardType="numeric"
          placeholder="Enter number"
        />

        <Text style={styles.label}>Event Location</Text>
        {position ? (
          <Text style={styles.coords}>
            Lat: {position.latitude.toFixed(4)} | Lng: {position.longitude.toFixed(4)}
          </Text>
        ) : (
          <Text style={{ color: "red" }}>No position selected.</Text>
        )}

        <Text style={styles.label}>Date and Time</Text>
        <RectButton style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateBtnText}>{date ? date.toLocaleString() : "Pick date & time"}</Text>
        </RectButton>
        {showDatePicker && <DateTimePicker value={tempDate} mode="date" onChange={onChangeDate} />}
        {showTimePicker && <DateTimePicker value={tempDate} mode="time" onChange={onChangeTime} />}
        {!isDateValid && date && <Text style={{ color: "red" }}>Date cannot be in the past.</Text>}

        <Text style={styles.label}>Picture</Text>
        <View style={styles.imageRow}>
          <RectButton style={styles.pickBtn} onPress={pickImage}>
            <Text style={styles.pickText}>Library</Text>
          </RectButton>
          <RectButton style={styles.pickBtn} onPress={takePhoto}>
            <Text style={styles.pickText}>Camera</Text>
          </RectButton>
        </View>
        {uploading && <Text style={{ color: "#007AFF" }}>Uploading...</Text>}

        {imageUrl && (
          <View style={styles.thumbRow}>
            <Image source={{ uri: imagePreviewUri ?? imageUrl }} style={styles.thumb} />
            <View>
              <Text style={styles.fileName}>{imageMeta?.name}</Text>
              <Text style={styles.fileMeta}>{imageMeta?.sizeKB ?? 0} KB</Text>
            </View>
          </View>
        )}

        <RectButton
          style={[styles.saveBtn, (!allValid || saving) && { opacity: 0.5 }]}
          enabled={!!(allValid && !saving)}
          onPress={onSave}
        >
          <Text style={styles.saveText}>{saving ? "Saving..." : "Save"}</Text>
        </RectButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F3F5", padding: 16 },
  header: { fontSize: 20, fontWeight: "700", color: "#4D6F80", marginBottom: 16 },
  form: { flex: 1 },
  label: { fontWeight: "700", color: "#5C6B73", marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: "#FFF", borderRadius: 12, paddingHorizontal: 12, height: 46 },
  coords: { color: "#007AFF", fontWeight: "700" },
  dateBtn: { backgroundColor: "#E6F4FF", padding: 12, borderRadius: 12, alignItems: "center" },
  dateBtnText: { color: "#007AFF", fontWeight: "700" },
  imageRow: { flexDirection: "row", gap: 10, marginTop: 6 },
  pickBtn: { backgroundColor: "#E6F4FF", padding: 10, borderRadius: 12 },
  pickText: { color: "#007AFF", fontWeight: "700" },
  thumbRow: { flexDirection: "row", alignItems: "center", marginTop: 10, gap: 12 },
  thumb: { width: 80, height: 60, borderRadius: 8 },
  fileName: { color: "#555" },
  fileMeta: { color: "#777" }, // added
  saveBtn: {
    backgroundColor: "#00A3FF",
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  saveText: { color: "#FFF", fontWeight: "800" },
});
