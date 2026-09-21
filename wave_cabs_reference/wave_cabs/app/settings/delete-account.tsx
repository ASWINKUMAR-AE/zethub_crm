import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { userAPI } from "../services/api";

const PRIMARY_COLOR = "#000";
const BG_COLOR = "#f8f9fa";
const CARD_BG = "#fff";
const BORDER_COLOR = "#eaeaea";

export default function DeleteAccountScreen() {
  const navigation = useNavigation();
  const [reason, setReason] = useState("");

  const handleDelete = async () => {
    if (!reason.trim()) {
      Alert.alert(
        "Error",
        "Please provide a reason for deleting your account."
      );
      return;
    }
    try {
     await userAPI.deleteAccount(reason);
Alert.alert("Success", "Your account has been deleted.");
navigation.reset({ index: 0, routes: [{ name: "LoginScreen" }] });

    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={PRIMARY_COLOR} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delete Account</Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.warningText}>
          Deleting your account is irreversible. Please provide a reason for
          deleting your account.
        </Text>
        <TextInput
          style={styles.textInput}
          placeholder="Reason for deleting account"
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={4}
        />
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  header: {
    backgroundColor: CARD_BG,
    paddingTop: Platform.OS === "ios" ? 50 : 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: PRIMARY_COLOR,
  },
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  warningText: {
    fontSize: 16,
    color: "#cc0000",
    marginBottom: 20,
  },
  textInput: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderColor: BORDER_COLOR,
    borderWidth: 1,
    textAlignVertical: "top",
  },
  deleteButton: {
    backgroundColor: "#cc0000",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
