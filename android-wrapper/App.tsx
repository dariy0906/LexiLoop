import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, type AppStateStatus, Linking, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { WebView, type WebViewMessageEvent, type WebViewNavigation } from 'react-native-webview';

const SITE_URL = 'https://lexi-loop.denoir.ceo';
const REMINDER_ENABLED_KEY = 'lexiloop.reminder.enabled';
const REMINDER_ID_KEY = 'lexiloop.reminder.id';
const REMINDER_CHANNEL_ID = 'lexiloop-reminders';
const REMINDER_SECONDS = 24 * 60 * 60;

type SiteMessage = { type?: string };

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function encodeSiteMessage(message: object) {
  return JSON.stringify(JSON.stringify(message));
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<{ injectJavaScript(script: string): void; reload(): void } | null>(null);
  const appState = useRef<AppStateStatus>((AppState.currentState ?? 'active') as AppStateStatus);

  const sendToSite = useCallback((message: object) => {
    webViewRef.current?.injectJavaScript(
      `window.dispatchEvent(new MessageEvent('message', { data: ${encodeSiteMessage(message)} })); true;`,
    );
  }, []);

  const cancelReminder = useCallback(async () => {
    const identifier = await AsyncStorage.getItem(REMINDER_ID_KEY);
    if (identifier) await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => undefined);
    await AsyncStorage.removeItem(REMINDER_ID_KEY);
  }, []);

  const scheduleReminder = useCallback(async () => {
    if (await AsyncStorage.getItem(REMINDER_ENABLED_KEY) !== 'true') return;
    await cancelReminder();
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Ready for a little LexiLoop?',
        body: 'Come back for a few English words — a little often works best.',
        data: { url: SITE_URL },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: REMINDER_SECONDS,
        channelId: REMINDER_CHANNEL_ID,
      },
    });
    await AsyncStorage.setItem(REMINDER_ID_KEY, identifier);
  }, [cancelReminder]);

  const enableReminder = useCallback(async () => {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: 'LexiLoop reminders',
      importance: AndroidImportance.DEFAULT,
      sound: 'default',
      vibrationPattern: [0, 250, 180, 250],
    });
    const existing = await Notifications.getPermissionsAsync();
    const permission = existing.status === 'granted' ? existing : await Notifications.requestPermissionsAsync();
    if (permission.status !== 'granted') {
      sendToSite({ type: 'lexiloop-reminder-status', enabled: false, reason: 'denied' });
      return;
    }
    await AsyncStorage.setItem(REMINDER_ENABLED_KEY, 'true');
    sendToSite({ type: 'lexiloop-reminder-status', enabled: true });
  }, [sendToSite]);

  const sendReminderStatus = useCallback(async () => {
    const [permission, enabled] = await Promise.all([
      Notifications.getPermissionsAsync(),
      AsyncStorage.getItem(REMINDER_ENABLED_KEY),
    ]);
    sendToSite({
      type: 'lexiloop-reminder-status',
      enabled: permission.status === 'granted' && enabled === 'true',
      reason: permission.status === 'granted' ? undefined : 'denied',
    });
  }, [sendToSite]);

  const handleSiteMessage = useCallback((event: WebViewMessageEvent) => {
    let message: SiteMessage;
    try {
      message = JSON.parse(event.nativeEvent.data) as SiteMessage;
    } catch {
      return;
    }
    if (message.type === 'lexiloop-reminder-enable') void enableReminder();
    if (message.type === 'lexiloop-reminder-status-request') void sendReminderStatus();
  }, [enableReminder, sendReminderStatus]);

  const handleNavigation = useCallback((request: WebViewNavigation) => {
    if (request.url.startsWith(SITE_URL)) return true;
    if (/^(mailto:|tel:|https?:)/.test(request.url)) {
      void Linking.openURL(request.url);
      return false;
    }
    return false;
  }, []);

  useEffect(() => {
    void cancelReminder();
    const subscription = AppState.addEventListener('change', (nextState) => {
      const wasActive = appState.current === 'active';
      if (nextState === 'active') void cancelReminder();
      if (wasActive && (nextState === 'inactive' || nextState === 'background')) void scheduleReminder();
      appState.current = nextState;
    });
    const response = Notifications.addNotificationResponseReceivedListener(() => webViewRef.current?.reload());
    return () => {
      subscription.remove();
      response.remove();
    };
  }, [cancelReminder, scheduleReminder]);

  return (
    <SafeAreaView style={styles.screen}>
      <WebView
        ref={(instance) => { webViewRef.current = instance as unknown as { injectJavaScript(script: string): void; reload(): void } | null; }}
        source={{ uri: SITE_URL }}
        onMessage={handleSiteMessage}
        onShouldStartLoadWithRequest={handleNavigation}
        onLoadEnd={() => {
          setLoading(false);
          void sendReminderStatus();
        }}
        javaScriptEnabled
        domStorageEnabled
        pullToRefreshEnabled
        startInLoadingState
        renderLoading={() => <View style={styles.loading}><ActivityIndicator color="#0d8275" size="large" /><Text style={styles.loadingText}>Loading LexiLoop…</Text></View>}
      />
      {loading ? <View pointerEvents="none" style={styles.loadingOverlay}><ActivityIndicator color="#0d8275" size="large" /></View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f7fbf9' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#f7fbf9' },
  loadingOverlay: { top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f7fbf9' },
  loadingText: { color: '#31554e', fontSize: 16 },
});
