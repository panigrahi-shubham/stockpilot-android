import React, { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { font, useTheme } from '@/theme';
import { AppHeader, Screen } from '@/components/chrome';
import { Button } from '@/components/ui';
import { useToast } from '@/components/overlays';

type Doc = 'terms' | 'help' | 'feedback';

/**
 * Hybrid screen: native header + WebView body.
 * Practise switching contexts: NATIVE_APP ⇄ WEBVIEW_com.stockpilot.b2b (Appium)
 * or screen.getByWebView().page() (Mobilewright). Every HTML element has an id.
 */
export default function WebScreen() {
  const { doc = 'terms' } = useLocalSearchParams<{ doc?: Doc }>();
  const { c, mode } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [readToEnd, setReadToEnd] = useState(false);
  const title = { terms: 'Terms of Trade', help: 'Help centre', feedback: 'Send feedback' }[doc];

  const onMessage = (raw: string) => {
    try {
      const msg = JSON.parse(raw);
      if (msg.type === 'scrolledToEnd') setReadToEnd(true);
      if (msg.type === 'feedback') {
        toast.show(`Thanks ${msg.name || ''}! Feedback (${msg.rating}★) received.`.replace('  ', ' '), 'success');
        router.back();
      }
      if (msg.type === 'openChat') router.replace('/chat');
    } catch {}
  };

  return (
    <Screen testID="webview-screen">
      <AppHeader testID="webview-header" title={title} mode="close" showCart={false} />
      <View style={{ flex: 1 }}>
        <WebView
          testID="webview"
          originWhitelist={['*']}
          source={{ html: HTML[doc](mode === 'dark') }}
          webviewDebuggingEnabled
          javaScriptEnabled
          onLoadEnd={() => setLoading(false)}
          onMessage={(e) => onMessage(e.nativeEvent.data)}
          style={{ flex: 1, backgroundColor: c.bg }}
        />
        {loading ? (
          <View testID="webview-loading" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg }}>
            <ActivityIndicator color={c.primary} size="large" />
            <Text style={[font.small, { color: c.textMuted, marginTop: 10 }]}>Loading…</Text>
          </View>
        ) : null}
      </View>
      {doc === 'terms' ? (
        <View style={{ padding: 16, paddingBottom: insets.bottom + 12, backgroundColor: c.card, borderTopWidth: 1, borderTopColor: c.border, gap: 6 }}>
          {!readToEnd ? (
            <Text testID="webview-scroll-hint" style={[font.small, { color: c.textMuted, textAlign: 'center' }]}>
              Scroll to the end to continue
            </Text>
          ) : null}
          <Button testID="webview-accept-button" title="I have read the terms" disabled={!readToEnd} onPress={() => router.back()} />
        </View>
      ) : null}
    </Screen>
  );
}

const css = (dark: boolean) => `
  *{box-sizing:border-box} body{margin:0;padding:18px 18px 40px;font-family:-apple-system,Roboto,'Segoe UI',sans-serif;font-size:15px;line-height:1.6;
  background:${dark ? '#0C1311' : '#F4F6F5'};color:${dark ? '#E7EFEC' : '#13201C'}}
  h1{font-size:22px;margin:4px 0 4px;color:${dark ? '#3BBB97' : '#0E5E4F'}} h2{font-size:17px;margin:22px 0 6px}
  .muted{color:${dark ? '#9AABA5' : '#5D6C67'};font-size:13px}
  .card{background:${dark ? '#151F1C' : '#fff'};border:1px solid ${dark ? '#24322E' : '#E1E7E4'};border-radius:14px;padding:14px;margin:12px 0}
  input,select,textarea{width:100%;font-size:16px;padding:12px;border-radius:10px;border:1.5px solid ${dark ? '#24322E' : '#E1E7E4'};background:${dark ? '#1A2622' : '#fff'};color:inherit;margin-top:6px}
  label{font-weight:600;font-size:13px;display:block;margin-top:14px}
  button{width:100%;padding:14px;border:0;border-radius:12px;background:${dark ? '#3BBB97' : '#0E5E4F'};color:${dark ? '#06201A' : '#fff'};font-size:16px;font-weight:700;margin-top:18px}
  .err{color:#D14343;font-size:13px;margin-top:8px;display:none} details{margin:8px 0} summary{font-weight:600;cursor:pointer;padding:10px 0}
  .row{display:flex;gap:8px;align-items:center;margin-top:12px} .row input{width:auto;margin:0}`;

const post = `function post(o){window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify(o))}`;

const TERMS_SECTIONS = [
  ['1. Definitions', '“StockPilot”, “we” and “us” refer to StockPilot Distribution Pvt Ltd. “Buyer” means the registered business placing an order through the app. “Goods” means products listed in the catalogue at the time of order.'],
  ['2. Eligibility', 'Only businesses with a valid GSTIN or trade licence may purchase. Goods are sold for resale or business use only and not for personal consumption.'],
  ['3. Pricing', 'Prices are wholesale prices per pack, exclusive of GST unless stated. Tier prices apply automatically based on the total units in a single order line. Prices may change without notice until an order is confirmed.'],
  ['4. Orders & approvals', 'An order is binding once confirmed. Orders above ₹50,000 placed by users with a manager are subject to approval. Rejected orders are not charged.'],
  ['5. Credit line', 'Credit is extended at our discretion on Net-30 terms from the date of delivery. Late payments attract interest of 1.5% per month and may lead to suspension of the credit line.'],
  ['6. Delivery', 'Delivery dates are estimates. Risk passes to the buyer on delivery. The buyer must check outer cartons and note any damage on the proof of delivery.'],
  ['7. Returns & disputes', 'Transit damage, shortages and wrong items must be reported within 48 hours of delivery with photographs. Near-expiry stock (less than 70% shelf life) may be returned within 7 days.'],
  ['8. Cancellations', 'Orders can be cancelled free of charge until they are packed. After packing a restocking fee of 2% may apply.'],
  ['9. Limitation of liability', 'Our total liability for any order is limited to the invoice value of that order. We are not liable for indirect or consequential losses including loss of profit.'],
  ['10. Data & privacy', 'We process business and contact data to fulfil orders, assess credit and comply with tax laws. We do not sell your data. See our privacy notice for details.'],
  ['11. Governing law', 'These terms are governed by the laws of India. Courts at Hyderabad, Telangana shall have exclusive jurisdiction.'],
  ['12. Changes', 'We may update these terms from time to time. Continued use of the app after an update constitutes acceptance of the revised terms.'],
];

const HTML: Record<Doc, (dark: boolean) => string> = {
  terms: (dark) => `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"/><style>${css(dark)}</style></head><body>
  <h1 id="terms-title">Terms of Trade</h1><p class="muted" id="terms-updated">Last updated 1 October 2026 · Version 4.2</p>
  ${TERMS_SECTIONS.map(([h, p], i) => `<section id="terms-section-${i + 1}"><h2>${h}</h2><p>${p}</p></section>`).join('')}
  <p id="terms-end" class="muted">— End of document —</p>
  <script>${post}
  var sent=false;function check(){if(sent)return;if(window.innerHeight+window.scrollY>=document.body.scrollHeight-24){sent=true;post({type:'scrolledToEnd'})}}
  window.addEventListener('scroll',check);setTimeout(check,400);</script></body></html>`,

  help: (dark) => `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"/><style>${css(dark)}</style></head><body>
  <h1 id="help-title">Help centre</h1><p class="muted">Guides for StockPilot buyers</p>
  <input id="help-search" type="search" placeholder="Search guides…" oninput="filter(this.value)"/>
  <div id="help-articles">
    <details class="card" id="article-ordering"><summary>Placing your first order</summary><p>Browse the catalogue, add items that meet the minimum order quantity, and check out once your cart is above ₹2,000.</p></details>
    <details class="card" id="article-credit"><summary>Using your credit line</summary><p>Choose “StockPilot Credit” at payment. Your available limit is shown on the home screen.</p></details>
    <details class="card" id="article-returns"><summary>Returns and damaged goods</summary><p>Open the order, tap “Report a problem” and attach a photo within 48 hours.</p></details>
    <details class="card" id="article-gst"><summary>Downloading GST invoices</summary><p>Invoices are available for shipped and delivered orders from the order details screen.</p></details>
  </div>
  <p id="help-no-results" class="muted" style="display:none">No guides match your search.</p>
  <button id="help-chat-button" onclick="post({type:'openChat'})">Chat with support</button>
  <script>${post}
  function filter(q){q=q.toLowerCase();var any=false;document.querySelectorAll('#help-articles details').forEach(function(d){var m=d.textContent.toLowerCase().indexOf(q)>=0;d.style.display=m?'block':'none';if(m)any=true});document.getElementById('help-no-results').style.display=any?'none':'block'}</script></body></html>`,

  feedback: (dark) => `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"/><style>${css(dark)}</style></head><body>
  <h1 id="feedback-title">Tell us how we’re doing</h1><p class="muted">Takes less than a minute. Your feedback goes straight to our product team.</p>
  <form id="feedback-form" onsubmit="return submitForm(event)" novalidate>
    <label for="fb-name">Your name</label><input id="fb-name" name="name" autocomplete="name" placeholder="e.g. Ravi"/>
    <label for="fb-rating">Overall rating</label>
    <select id="fb-rating" name="rating"><option value="">Select…</option><option value="5">★★★★★ Excellent</option><option value="4">★★★★ Good</option><option value="3">★★★ Okay</option><option value="2">★★ Poor</option><option value="1">★ Very poor</option></select>
    <label for="fb-area">What is this about?</label>
    <select id="fb-area" name="area"><option>Catalogue & prices</option><option>Delivery</option><option>Payments & credit</option><option>App experience</option></select>
    <label for="fb-comments">Comments</label><textarea id="fb-comments" name="comments" rows="4" maxlength="500" placeholder="What can we improve?"></textarea>
    <div class="row"><input type="checkbox" id="fb-contact" name="contact"/><label for="fb-contact" style="margin:0">You may contact me about this feedback</label></div>
    <div class="err" id="fb-error"></div>
    <button id="fb-submit" type="submit">Submit feedback</button>
  </form>
  <script>${post}
  function submitForm(e){e.preventDefault();var r=document.getElementById('fb-rating').value,c=document.getElementById('fb-comments').value.trim(),err=document.getElementById('fb-error');
  if(!r){err.textContent='Please select a rating.';err.style.display='block';return false}
  if(c.length<10){err.textContent='Comments must be at least 10 characters.';err.style.display='block';return false}
  err.style.display='none';document.getElementById('fb-submit').textContent='Submitting…';
  setTimeout(function(){post({type:'feedback',name:document.getElementById('fb-name').value.trim(),rating:r,area:document.getElementById('fb-area').value,comments:c,contact:document.getElementById('fb-contact').checked})},800);return false}</script></body></html>`,
};
