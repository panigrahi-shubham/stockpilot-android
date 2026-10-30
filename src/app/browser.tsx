import React, { useEffect, useRef, useState } from 'react';
import { BackHandler, Linking, Pressable, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnline } from '@/state/network';
import { font, radius, useTheme } from '@/theme';
import { AppHeader, Screen } from '@/components/chrome';
import { Button, ProgressBar } from '@/components/ui';
import { Sheet } from '@/components/overlays';

const BOOKMARKS = [
  { id: 'gst', title: 'GST taxpayer search', subtitle: 'services.gst.gov.in · verify any GSTIN', url: 'https://services.gst.gov.in/services/searchtp' },
  { id: 'pincode', title: 'India Post pincode API', subtitle: 'api.postalpincode.in · raw JSON', url: 'https://api.postalpincode.in/pincode/500016' },
  { id: 'login', title: 'Practice: login form', subtitle: 'the-internet.herokuapp.com · tomsmith / SuperSecretPassword!', url: 'https://the-internet.herokuapp.com/login' },
  { id: 'dynamic', title: 'Practice: dynamic loading', subtitle: 'the-internet.herokuapp.com · wait for element', url: 'https://the-internet.herokuapp.com/dynamic_loading/2' },
  { id: 'saucedemo', title: 'Practice: Sauce Demo shop', subtitle: 'saucedemo.com · standard_user / secret_sauce', url: 'https://www.saucedemo.com' },
  { id: 'appium', title: 'Appium documentation', subtitle: 'appium.io', url: 'https://appium.io/docs/en/latest/' },
];

const START = 'about:stockpilot';

/**
 * In-app web browser (ONLINE hybrid WebView).
 * Real websites load inside the app → practise WEBVIEW context switching against live pages,
 * page-load waits, navigation (back/forward/reload) and offline error handling.
 *   stockpilot://browser                       → start page with bookmarks
 *   stockpilot://browser?url=https://...       → open a URL directly
 */
export default function Browser() {
  const { url: initialUrl } = useLocalSearchParams<{ url?: string }>();
  const { c, mode } = useTheme();
  const insets = useSafeAreaInsets();
  const { online } = useOnline();
  const ref = useRef<React.ComponentRef<typeof WebView>>(null);
  const [url, setUrl] = useState(initialUrl || START);
  const [address, setAddress] = useState(initialUrl || '');
  const [nav, setNav] = useState({ canGoBack: false, canGoForward: false, title: 'Start page', loading: false });
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (nav.canGoBack && !error) {
        ref.current?.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [nav.canGoBack, error]);

  const open = (raw: string) => {
    let u = raw.trim();
    if (!u) return;
    if (!/^https?:\/\//i.test(u)) u = /\s|^[^.]+$/.test(u) ? `https://duckduckgo.com/html/?q=${encodeURIComponent(u)}` : `https://${u}`;
    setError(null);
    setAddress(u);
    setUrl(u);
    setBookmarks(false);
  };

  const onNav = (n: WebViewNavigation) => {
    setNav({ canGoBack: n.canGoBack, canGoForward: n.canGoForward, title: n.title || '', loading: n.loading });
    if (!editing && n.url && !n.url.startsWith('about:') && !n.url.startsWith('data:')) setAddress(n.url);
  };

  const secure = address.startsWith('https://');
  const isStart = url === START;

  return (
    <Screen testID="browser-screen">
      <AppHeader testID="browser-header" title={isStart ? 'Web portal' : nav.title || 'Loading…'} subtitle={isStart ? 'Online pages inside the app' : address.replace(/^https?:\/\//, '').split('/')[0]} mode="close" showCart={false} />
      <View style={{ backgroundColor: c.card, paddingHorizontal: 12, paddingBottom: 8, gap: 6, borderBottomWidth: 1, borderBottomColor: c.border }}>
        <View style={{ height: 42, borderRadius: radius.pill, backgroundColor: c.cardAlt, borderWidth: 1, borderColor: editing ? c.primary : c.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 }}>
          <Ionicons testID="browser-lock-icon" name={isStart ? 'home-outline' : secure ? 'lock-closed' : 'lock-open-outline'} size={15} color={secure || isStart ? c.success : c.warning} />
          <TextInput
            testID="browser-url-input"
            accessibilityLabel="Address bar"
            value={address}
            onChangeText={setAddress}
            onFocus={() => setEditing(true)}
            onBlur={() => setEditing(false)}
            onSubmitEditing={() => open(address)}
            placeholder="Search or type a web address"
            placeholderTextColor={c.textFaint}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
            selectTextOnFocus
            style={[font.small, { flex: 1, color: c.text }]}
          />
          {nav.loading ? (
            <Pressable testID="browser-stop-button" accessibilityLabel="Stop loading" hitSlop={8} onPress={() => ref.current?.stopLoading()}>
              <Ionicons name="close" size={18} color={c.textMuted} />
            </Pressable>
          ) : null}
        </View>
        {nav.loading && progress < 1 ? <ProgressBar testID="browser-progress" value={progress} height={3} /> : <View style={{ height: 3 }} />}
      </View>

      <View style={{ flex: 1 }}>
        {error ? (
          <View testID="browser-error" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, gap: 12, backgroundColor: c.bg }}>
            <Ionicons name={online ? 'warning-outline' : 'cloud-offline-outline'} size={54} color={c.textFaint} />
            <Text style={[font.h2, { color: c.text, textAlign: 'center' }]}>{online ? 'This page didn’t load' : 'You’re offline'}</Text>
            <Text testID="browser-error-message" style={[font.body, { color: c.textMuted, textAlign: 'center' }]}>
              {error}
            </Text>
            <Button testID="browser-retry-button" title="Try again" icon="refresh" full={false} onPress={() => { setError(null); ref.current?.reload(); }} />
          </View>
        ) : null}
        <WebView
          ref={ref}
          testID="browser-webview"
          source={isStart ? { html: startPage(mode === 'dark') } : { uri: url }}
          originWhitelist={['*']}
          webviewDebuggingEnabled
          javaScriptEnabled
          domStorageEnabled
          setSupportMultipleWindows={false}
          onNavigationStateChange={onNav}
          onLoadStart={() => setProgress(0.05)}
          onLoadProgress={(e) => setProgress(e.nativeEvent.progress)}
          onError={(e) => setError(`${e.nativeEvent.description || 'Network error'} (code ${e.nativeEvent.code})`)}
          onHttpError={(e) => {
            if (e.nativeEvent.statusCode >= 500) setError(`The server returned HTTP ${e.nativeEvent.statusCode}.`);
          }}
          onMessage={(e) => open(e.nativeEvent.data)}
          style={{ flex: 1, backgroundColor: c.bg, display: error ? 'none' : 'flex' }}
        />
      </View>

      <View testID="browser-toolbar" style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingTop: 8, paddingBottom: insets.bottom + 8, backgroundColor: c.card, borderTopWidth: 1, borderTopColor: c.border }}>
        <ToolBtn testID="browser-back-button" icon="chevron-back" label="Back" disabled={!nav.canGoBack} onPress={() => ref.current?.goBack()} />
        <ToolBtn testID="browser-forward-button" icon="chevron-forward" label="Forward" disabled={!nav.canGoForward} onPress={() => ref.current?.goForward()} />
        <ToolBtn testID="browser-reload-button" icon="refresh" label="Reload" onPress={() => { setError(null); ref.current?.reload(); }} />
        <ToolBtn testID="browser-home-button" icon="home-outline" label="Start page" onPress={() => { setError(null); setAddress(''); setUrl(START); }} />
        <ToolBtn testID="browser-bookmarks-button" icon="bookmarks-outline" label="Bookmarks" onPress={() => setBookmarks(true)} />
        <ToolBtn testID="browser-open-external" icon="open-outline" label="Open in browser" disabled={isStart} onPress={() => Linking.openURL(address)} />
      </View>

      <Sheet visible={bookmarks} onClose={() => setBookmarks(false)} title="Bookmarks" testID="browser-bookmarks-sheet">
        {BOOKMARKS.map((b) => (
          <Pressable key={b.id} testID={`browser-bookmark-${b.id}`} onPress={() => open(b.url)} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.border }}>
            <Text style={[font.bodyStrong, { color: c.text }]}>{b.title}</Text>
            <Text style={[font.small, { color: c.textMuted }]}>{b.subtitle}</Text>
          </Pressable>
        ))}
      </Sheet>
    </Screen>
  );
}

function ToolBtn({ testID, icon, label, onPress, disabled }: { testID: string; icon: any; label: string; onPress: () => void; disabled?: boolean }) {
  const { c } = useTheme();
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress} hitSlop={6} style={{ padding: 8, opacity: disabled ? 0.3 : 1 }}>
      <Ionicons name={icon} size={22} color={c.text} />
    </Pressable>
  );
}

function startPage(dark: boolean) {
  const bg = dark ? '#0C1311' : '#F4F6F5';
  const card = dark ? '#151F1C' : '#fff';
  const text = dark ? '#E7EFEC' : '#13201C';
  const muted = dark ? '#9AABA5' : '#5D6C67';
  const accent = dark ? '#3BBB97' : '#0E5E4F';
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Web portal</title>
<style>body{margin:0;padding:18px;font-family:-apple-system,Roboto,sans-serif;background:${bg};color:${text}}
h1{font-size:22px;margin:4px 0;color:${accent}}p{color:${muted};font-size:14px}
a{display:block;text-decoration:none;color:${text};background:${card};border-radius:14px;padding:14px;margin:10px 0;border:1px solid ${dark ? '#24322E' : '#E1E7E4'}}
a b{display:block;font-size:15px}a span{font-size:12px;color:${muted}}
form{display:flex;gap:8px;margin:14px 0}input{flex:1;font-size:16px;padding:12px;border-radius:12px;border:1.5px solid ${dark ? '#24322E' : '#E1E7E4'};background:${card};color:${text}}
button{padding:0 16px;border:0;border-radius:12px;background:${accent};color:${dark ? '#06201A' : '#fff'};font-weight:700}</style></head>
<body><h1 id="portal-title">StockPilot web portal</h1><p id="portal-subtitle">These pages load live from the internet inside the app. Switch your test to the WEBVIEW context to automate them.</p>
<form id="portal-search-form" onsubmit="event.preventDefault();window.ReactNativeWebView.postMessage(document.getElementById('portal-search').value)">
<input id="portal-search" placeholder="Type a URL, e.g. example.com" autocapitalize="none"/><button id="portal-go" type="submit">Go</button></form>
${BOOKMARKS.map((b) => `<a id="portal-link-${b.id}" href="${b.url}"><b>${b.title}</b><span>${b.subtitle}</span></a>`).join('')}
<p id="portal-footer">Tip: links open inside this WebView. Use the native toolbar below to go back.</p></body></html>`;
}
