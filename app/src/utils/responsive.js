import { Platform, useWindowDimensions } from 'react-native';

export const useResponsiveLayout = () => {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isMobile = width < 768;

  return { isWeb, isDesktop, isTablet, isMobile, width };
};
