import { NativeSettings, AndroidSettings, IOSSettings } from 'capacitor-native-settings';

export const openAppSettings = async (notifications = false): Promise<boolean> => {
  try {
    await NativeSettings.open({
      optionAndroid: notifications ? AndroidSettings.AppNotification : AndroidSettings.ApplicationDetails,
      optionIOS: notifications ? IOSSettings.AppNotification : IOSSettings.App,
    });
    return true;
  } catch {
    return false;
  }
};
