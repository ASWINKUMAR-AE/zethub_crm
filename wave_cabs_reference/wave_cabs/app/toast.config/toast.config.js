import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const toastConfig = {
  success: ({ text1, text2 }) => (
    <View style={styles.toastSuccess}>
      <Ionicons name="checkmark-circle" size={24} color="#fff" />
      <View style={styles.toastTextContainer}>
        <Text style={styles.toastHeader}>{text1}</Text>
        <Text style={styles.toastMessage}>{text2}</Text>
      </View>
    </View>
  ),
  error: ({ text1, text2 }) => (
    <View style={styles.toastError}>
      <Ionicons name="close-circle" size={24} color="#fff" />
      <View style={styles.toastTextContainer}>
        <Text style={styles.toastHeader}>{text1}</Text>
        <Text style={styles.toastMessage}>{text2}</Text>
      </View>
    </View>
  ),
};

const styles = StyleSheet.create({
  toastSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4BB543',
    padding: 15,
    borderRadius: 10,
    width: '90%',
    marginHorizontal: 20,
  },
  toastError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3333',
    padding: 15,
    borderRadius: 10,
    width: '90%',
    marginHorizontal: 20,
  },
  toastTextContainer: {
    marginLeft: 10,
    flexShrink: 1,
  },
  toastHeader: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  toastMessage: {
    color: '#fff',
    fontSize: 14,
  },
});