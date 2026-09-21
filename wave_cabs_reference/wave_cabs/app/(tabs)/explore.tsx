import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import React from "react";
import {
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

const PRIMARY_COLOR = "#000000";
const SECONDARY_COLOR = "#333333";
const LIGHT_GRAY = "#F8F8F8";
const MEDIUM_GRAY = "#E0E0E0";
const DARK_GRAY = "#424242";
const WHITE = "#FFFFFF";
const BLACK = "#000000";

const ExplorePage = ({ onBack }) => {
  const navigation = useNavigation();

  const handleBack = () => {
    if (navigation && navigation.canGoBack()) {
      navigation.goBack();
    } else if (onBack) {
      onBack();
    }
  };

  const packages = [
    {
      title: "Mountain Escape",
      subtitle: "Breathe the fresh alpine air",
      image:
        "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=60",
      description:
        "Discover serene mountain trails, cozy stays, and breathtaking sunrise views. A perfect getaway for peace seekers.",
    },
    {
      title: "Beachside Bliss",
      subtitle: "Waves, sand, and sunsets",
      image:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=60",
      description:
        "Relax under palm trees, explore coastal cuisine, and soak in golden sunsets by the sea.",
    },
    {
      title: "City Lights Tour",
      subtitle: "Explore urban life at its best",
      image:
        "https://images.unsplash.com/photo-1494783367193-149034c05e8f?auto=format&fit=crop&w=1200&q=60",
      description:
        "Experience the vibrant rhythm of the city with shopping, nightlife, and iconic landmarks.",
    },
    {
      title: "Desert Adventure",
      subtitle: "Ride through golden dunes",
      image:
        "https://images.unsplash.com/photo-1504198266285-1659872e6590?auto=format&fit=crop&w=1200&q=60",
      description:
        "Thrilling dune safaris, cultural performances, and starlit camps make this an unforgettable escape.",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backIcon}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={26} color={WHITE} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}> PACKAGES</Text>

        </View>

        <View style={styles.headerCircle1} />
        <View style={styles.headerCircle2} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {packages.map((pkg, index) => (
          <PackageCard key={index} {...pkg} />
        ))}

        <View style={styles.brandFooter}>
          <Text style={styles.brandFooterText}>
            Every destination, one emotion —{" "}
            <Text style={styles.brandAccent}>#ExploreTheWave</Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const PackageCard = ({ title, subtitle, image, description }) => (
  <View style={styles.card}>
    <Image source={{ uri: image }} style={styles.cardImage} />
    <View style={styles.cardOverlay} />
    <View style={styles.cardContent}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
      <Text style={styles.cardDescription}>{description}</Text>
    </View>
  </View>
);

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT_GRAY,
  },
  header: {
    backgroundColor: PRIMARY_COLOR,
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: MEDIUM_GRAY,
 
    marginTop:40,
    marginBottom:10,
    borderRadius:50,
    marginHorizontal:20,
    alignItems: "center",
    
    overflow: "hidden",
  },
  backIcon: {
    position: "absolute",
    top: 9,
    left: 18,
    zIndex: 3,
    padding: 6,
  },
  headerContent: {
    alignItems: "center",
    zIndex: 2,
  },
  headerTitle: {
    color: WHITE,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 1.2,
    textAlign: "center",
    marginBottom: 6,
  },
  headerSubtitle: {
    color: MEDIUM_GRAY,
    fontSize: 14,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  headerCircle1: {
    position: "absolute",
    top: -40,
    left: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    zIndex: 1,
  },
  headerCircle2: {
    position: "absolute",
    bottom: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    zIndex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingVertical: 28,
  },
  card: {
    backgroundColor: WHITE,
    borderRadius: 20,
    marginBottom: 20,
    overflow: "hidden",
    shadowColor: BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardImage: {
    width: "100%",
    height: width * 0.5,
    resizeMode: "cover",
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  cardContent: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  cardTitle: {
    color: WHITE,
    fontSize: 20,
    fontWeight: "700",
  },
  cardSubtitle: {
    color: "#f2f2f2",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
  },
  cardDescription: {
    color: "#f0f0f0",
    fontSize: 12,
    lineHeight: 18,
  },
  brandFooter: {
    alignItems: "center",
    marginTop: 20,
    padding: 14,
    backgroundColor: WHITE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: MEDIUM_GRAY,
  },
  brandFooterText: {
    color: DARK_GRAY,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  brandAccent: {
    color: PRIMARY_COLOR,
    fontWeight: "700",
  },
});

export default ExplorePage;
