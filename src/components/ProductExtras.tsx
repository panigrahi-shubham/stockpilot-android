import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/state/AppContext';
import { useApiError } from '@/state/useApiError';
import { api } from '@/data/api';
import type { Product } from '@/data/catalog';
import { Review, reviewsFor } from '@/data/marketplace';
import { timeAgo } from '@/utils/format';
import { font, radius, useTheme } from '@/theme';
import { Badge, Button, Checkbox, Segmented, Stars, TextField } from './ui';
import { Sheet, useToast } from './overlays';

/* ================================================================== Ratings & reviews */
export function ReviewsSection({ product }: { product: Product }) {
  const { c } = useTheme();
  const toast = useToast();
  const { state, actions } = useApp();
  const { dist, reviews } = useMemo(() => reviewsFor(product), [product]);
  const mine = state.myReviews[product.sku] ?? [];
  const all = [...mine, ...reviews];
  const [allOpen, setAllOpen] = useState(false);
  const [writeOpen, setWriteOpen] = useState(false);
  const [sort, setSort] = useState<'recent' | 'helpful' | 'low'>('recent');
  const total = dist.reduce((s, n) => s + n, 0);
  const sorted = [...all].sort((a, b) =>
    sort === 'helpful' ? b.helpful - a.helpful : sort === 'low' ? a.rating - b.rating : +new Date(b.at) - +new Date(a.at),
  );

  return (
    <View testID="product-reviews" style={{ gap: 12 }}>
      <Text style={[font.h3, { color: c.text }]}>Ratings & reviews</Text>
      <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
        <View style={{ alignItems: 'center', width: 96 }}>
          <Text testID="product-rating-average" style={[font.h1, { color: c.text, fontSize: 36 }]}>
            {product.rating.toFixed(1)}
          </Text>
          <Stars value={product.rating} size={13} />
          <Text testID="product-rating-total" style={[font.tiny, { color: c.textMuted, marginTop: 4 }]}>
            {total.toLocaleString('en-IN')} ratings
          </Text>
        </View>
        <View style={{ flex: 1, gap: 5 }}>
          {[5, 4, 3, 2, 1].map((star, i) => (
            <View key={star} testID={`product-rating-bar-${star}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[font.small, { color: c.textMuted, width: 26 }]}>{star}★</Text>
              <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: c.border, overflow: 'hidden' }}>
                <View style={{ width: `${total ? (dist[i] / total) * 100 : 0}%`, height: '100%', backgroundColor: star >= 4 ? c.success : star === 3 ? c.accent : c.danger }} />
              </View>
              <Text testID={`product-rating-count-${star}`} style={[font.tiny, { color: c.textMuted, width: 42, textAlign: 'right' }]}>
                {dist[i]}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {all.slice(0, 2).map((r) => (
        <ReviewCard key={r.id} r={r} />
      ))}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button testID="product-all-reviews-button" title={`All ${all.length} reviews`} variant="secondary" size="sm" style={{ flex: 1 }} onPress={() => setAllOpen(true)} />
        <Button testID="product-write-review-button" title="Write a review" icon="create-outline" variant="outline" size="sm" style={{ flex: 1 }} onPress={() => setWriteOpen(true)} />
      </View>

      <Sheet visible={allOpen} onClose={() => setAllOpen(false)} title={`Reviews (${all.length})`} testID="reviews-sheet">
        <Segmented
          testID="reviews-sort"
          value={sort}
          onChange={setSort}
          options={[
            { value: 'recent', label: 'Most recent' },
            { value: 'helpful', label: 'Most helpful' },
            { value: 'low', label: 'Lowest' },
          ]}
        />
        <ScrollView testID="reviews-list" style={{ maxHeight: 440, marginTop: 10 }} contentContainerStyle={{ gap: 10, paddingBottom: 10 }}>
          {sorted.map((r) => (
            <ReviewCard key={r.id} r={r} onHelpful={() => toast.show('Thanks for your feedback', 'success')} />
          ))}
        </ScrollView>
      </Sheet>
      <WriteReviewSheet
        visible={writeOpen}
        onClose={() => setWriteOpen(false)}
        onSubmit={(rating, title, body) => {
          actions.addReview(product.sku, {
            id: `${product.sku}-ME-${Date.now()}`,
            author: state.user?.name ?? 'You',
            city: state.user?.city ?? '',
            rating,
            title,
            body,
            at: new Date().toISOString(),
            verified: state.orders.some((o) => o.lines.some((l) => l.sku === product.sku)),
            helpful: 0,
          });
          setWriteOpen(false);
          toast.show('Review published. Thank you!', 'success');
        }}
      />
    </View>
  );
}

function ReviewCard({ r, onHelpful }: { r: Review; onHelpful?: () => void }) {
  const { c } = useTheme();
  return (
    <View testID={`review-${r.id}`} style={{ padding: 12, borderRadius: radius.md, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, gap: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: r.rating >= 4 ? c.success : r.rating === 3 ? c.accent : c.danger, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>{r.rating}</Text>
          <Ionicons name="star" size={10} color="#fff" />
        </View>
        <Text style={[font.bodyStrong, { color: c.text, flex: 1 }]} numberOfLines={1}>
          {r.title}
        </Text>
      </View>
      <Text style={[font.small, { color: c.textMuted, lineHeight: 18 }]}>{r.body}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
        <Text style={[font.tiny, { color: c.textFaint, flex: 1 }]}>
          {r.author}
          {r.city ? `, ${r.city}` : ''} · {timeAgo(r.at)}
        </Text>
        {r.verified ? <Badge label="Verified buyer" tone="success" icon="checkmark-circle" /> : null}
        {onHelpful ? (
          <Pressable testID={`review-helpful-${r.id}`} onPress={onHelpful} hitSlop={6} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Ionicons name="thumbs-up-outline" size={13} color={c.textMuted} />
            <Text style={[font.tiny, { color: c.textMuted }]}>{r.helpful}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function WriteReviewSheet({ visible, onClose, onSubmit }: { visible: boolean; onClose: () => void; onSubmit: (rating: number, title: string, body: string) => void }) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [e, setE] = useState<Record<string, string | undefined>>({});
  const submit = () => {
    const er: Record<string, string> = {};
    if (!rating) er.rating = 'Tap a star to rate';
    if (title.trim().length < 5) er.title = 'Title must be at least 5 characters';
    if (body.trim().length < 20) er.body = 'Review must be at least 20 characters';
    setE(er);
    if (Object.keys(er).length) return;
    onSubmit(rating, title.trim(), body.trim());
    setRating(0);
    setTitle('');
    setBody('');
  };
  const { c } = useTheme();
  return (
    <Sheet visible={visible} onClose={onClose} title="Write a review" testID="write-review-sheet" footer={<Button testID="write-review-submit" title="Publish review" onPress={submit} />}>
      <View style={{ gap: 12 }}>
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Stars testID="write-review-stars" value={rating} size={34} onChange={(v) => { setRating(v); setE((x) => ({ ...x, rating: undefined })); }} />
          {e.rating ? <Text testID="write-review-stars-error" style={[font.small, { color: c.danger }]}>{e.rating}</Text> : null}
        </View>
        <TextField testID="write-review-title" label="Title" value={title} onChangeText={setTitle} error={e.title} maxLength={60} />
        <TextField testID="write-review-body" label="Your review" multiline maxLength={400} showCounter value={body} onChangeText={setBody} error={e.body} />
      </View>
    </Sheet>
  );
}

/* ================================================================== "Get best price" enquiry */
export function EnquirySheet({ product, visible, onClose }: { product: Product; visible: boolean; onClose: () => void }) {
  const { c } = useTheme();
  const toast = useToast();
  const onError = useApiError();
  const { state, actions } = useApp();
  const user = state.user!;
  const [qty, setQty] = useState(String(Math.max(product.moq * 10, 10)));
  const [req, setReq] = useState('');
  const [city, setCity] = useState(user.city);
  const [wa, setWa] = useState(true);
  const [e, setE] = useState<Record<string, string | undefined>>({});
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const er: Record<string, string> = {};
    const q = Number(qty);
    if (!q || q < product.moq) er.qty = `Minimum enquiry quantity is ${product.moq}`;
    if (req.trim().length < 20) er.req = 'Tell the seller a little more (min 20 characters)';
    if (city.trim().length < 3) er.city = 'Enter the delivery city';
    setE(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      await api.generic(true);
      const id = `LD-${Math.floor(9100 + Math.random() * 800)}`;
      actions.addLead({
        id,
        buyerName: user.name,
        company: user.business,
        phone: user.phone,
        city: city.trim(),
        productTitle: product.name,
        quantity: q,
        unit: 'units',
        requirement: req.trim(),
        status: 'new',
        createdAt: new Date().toISOString(),
        whatsapp: wa,
        source: 'enquiry-form',
      });
      onClose();
      setReq('');
      toast.show(`Enquiry ${id} sent. Sellers usually reply within 2 hours.`, 'success');
    } catch (x) {
      onError(x);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Get best price" testID="enquiry-sheet" footer={<Button testID="enquiry-submit-button" title="Send enquiry" icon="send" loading={busy} onPress={submit} />}>
      <ScrollView style={{ maxHeight: 460 }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12 }}>
        <Text testID="enquiry-product" style={[font.bodyStrong, { color: c.text }]} numberOfLines={2}>
          {product.name}
        </Text>
        <TextField testID="enquiry-qty-input" label={`Quantity (units, min ${product.moq})`} keyboardType="number-pad" value={qty} onChangeText={(v) => setQty(v.replace(/[^0-9]/g, ''))} error={e.qty} />
        <TextField testID="enquiry-requirement-input" label="Requirement details" placeholder="Frequency, packing, delivery timeline, credit terms…" multiline maxLength={300} showCounter value={req} onChangeText={setReq} error={e.req} />
        <TextField testID="enquiry-city-input" label="Delivery city" value={city} onChangeText={setCity} error={e.city} icon="location-outline" />
        <TextField testID="enquiry-phone-input" label="Mobile (from your profile)" value={`+91 ${user.phone}`} editable={false} icon="call-outline" />
        <Checkbox testID="enquiry-whatsapp-checkbox" label="Sellers can contact me on WhatsApp" checked={wa} onChange={setWa} />
        <Text style={[font.tiny, { color: c.textFaint }]}>Demo note: your enquiry also appears in Seller Hub → Leads so you can test both sides of the flow.</Text>
      </ScrollView>
    </Sheet>
  );
}
