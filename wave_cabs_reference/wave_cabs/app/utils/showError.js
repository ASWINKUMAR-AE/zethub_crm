import { Alert, Platform, ToastAndroid } from 'react-native';
import Toast from 'react-native-toast-message';

/**
 * Show a user-friendly error message.
 * Uses react-native-toast-message when available and falls back to
 * Alert (iOS) or ToastAndroid (Android) so errors are always visible.
 *
 * @param {string} message - Main message to show
 * @param {string} [title] - Optional short title
 */
export function showError(message, title = 'Error') {
  try {
    // Try toast first (requires Toast component mounted in app)
    Toast.show({
      type: 'error',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 4000,
      autoHide: true,
    });
  } catch (e) {
    // Fallbacks
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.LONG);
    } else {
      Alert.alert(title, message);
    }
  }
}
