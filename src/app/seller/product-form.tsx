import React, { useRef, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View, type ScrollViewInstance } from 'react-native';
import { useLocalSearchParams, usePreventRemove, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/state/AppContext';
import { useApiError } from '@/state/useApiError';
import { api } from '@/data/api';
import { SELLER_CATEGORIES, SellerProduct, UNITS } from '@/data/marketplace';
import { font, radius, useTheme } from '@/theme';
import { AppHeader, Screen } from '@/components/chrome';
import { Button, Card, ProgressBar, SwitchRow, TextField } from '@/components/ui';
import { ConfirmDialog, LoadingOverlay, SelectField, Sheet, useToast } from '@/components/overlays';

const MAX_PHOTOS = 5;
const MAX_SPECS = 6;
const TITLE_MAX = 80;

type Form = Omit<SellerProduct, 'id' | 'status' | 'views' | 'enquiries' | 'updatedAt' | 'price' | 'mrp' | 'moq'> & {
  price: string;
  mrp: string;
  moq: string;
  active: boolean;
};

const blank: Form = { title: '', category: '', price: '', mrp: '', moq: '', unit: 'Box', description: '', specs: [['', '']], photos: [], cover: 0, active: true };

/** Add / edit a marketplace listing.  /seller/product-form            → new
 *                                      /seller/product-form?id=L-2001 → edit */
export default function ProductForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { c } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const onError = useApiError();
  const insets = useSafeAreaInsets();
  const { state, actions } = useApp();
  const existing = state.sellerProducts.find((x) => x.id === id);
  const initial: Form = existing
    ? {
        ...existing,
        price: existing.price ? String(existing.price) : '',
        mrp: existing.mrp ? String(existing.mrp) : '',
        moq: existing.moq ? String(existing.moq) : '',
        specs: existing.specs.length ? existing.specs : [['', '']],
        active: existing.status !== 'inactive',
      }
    : blank;
  const [f, setF] = useState<Form>(initial);
  const [e, setE] = useState<Record<string, string | undefined>>({});
  const [uploading, setUploading] = useState<number | null>(null);
  const [sourceSheet, setSourceSheet] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [leave, setLeave] = useState<null | (() => void)>(null);
  const scroll = useRef<ScrollViewInstance>(null);
  const dirty = JSON.stringify(f) !== JSON.stringify(initial);
  const disablePrevention = usePreventRemove(dirty && !saving, ({ repeat }) => setLeave(() => repeat));

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setF((x) => ({ ...x, [k]: v }));
    setE((x) => ({ ...x, [k]: undefined }));
  };

  /* ------------------------------------------------ photos */
  const pickPhoto = async (camera: boolean) => {
    setSourceSheet(false);
    if (f.photos.length >= MAX_PHOTOS) return toast.show(`You can add up to ${MAX_PHOTOS} photos`, 'error');
    const perm = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return toast.show(`${camera ? 'Camera' : 'Photo library'} permission is required to add photos`, 'error');
    const res = camera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.5, allowsEditing: true, aspect: [1, 1] })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.5, allowsMultipleSelection: false });
    if (res.canceled || !res.assets[0]) return;
    const uri = res.assets[0].uri;
    // Simulated 1.5 s upload with a progress bar — wait for it in your tests.
    const idx = f.photos.length;
    setUploading(0);
    for (let p = 0; p <= 100; p += 20) {
      setUploading(p);
      await new Promise((r) => setTimeout(r, 250));
    }
    setUploading(null);
    setF((x) => ({ ...x, photos: [...x.photos, uri], cover: x.photos.length === 0 ? 0 : x.cover }));
    setE((x) => ({ ...x, photos: undefined }));
    toast.show(`Photo ${idx + 1} uploaded`, 'success');
  };

  const removePhoto = (i: number) =>
    setF((x) => {
      const photos = x.photos.filter((_, k) => k !== i);
      const cover = x.cover === i ? 0 : x.cover > i ? x.cover - 1 : x.cover;
      return { ...x, photos, cover };
    });

  /* ------------------------------------------------ specs */
  const setSpec = (i: number, part: 0 | 1, v: string) => set('specs', f.specs.map((s, k) => (k === i ? ((part === 0 ? [v, s[1]] : [s[0], v]) as [string, string]) : s)));
  const addSpec = () => (f.specs.length >= MAX_SPECS ? toast.show(`Maximum ${MAX_SPECS} specifications`, 'error') : set('specs', [...f.specs, ['', '']]));
  const removeSpec = (i: number) => set('specs', f.specs.filter((_, k) => k !== i));

  /* ------------------------------------------------ save */
  const validate = (publish: boolean) => {
    const er: Record<string, string> = {};
    if (f.title.trim().length < (publish ? 10 : 3)) er.title = publish ? 'Title must be at least 10 characters' : 'Add a title (min 3 characters) to save a draft';
    if (publish) {
      if (!f.category) er.category = 'Choose a category';
      const price = Number(f.price);
      const mrp = Number(f.mrp);
      if (!price || price <= 0) er.price = 'Enter a selling price';
      if (!mrp) er.mrp = 'Enter the MRP';
      else if (price > mrp) er.mrp = 'MRP must be greater than or equal to the selling price';
      if (!Number(f.moq) || Number(f.moq) < 1) er.moq = 'Minimum order quantity must be at least 1';
      if (f.description.trim().length < 30) er.description = 'Describe the product in at least 30 characters';
      if (!f.photos.length) er.photos = 'Add at least one photo';
      f.specs.forEach(([k, v], i) => {
        if ((k && !v) || (!k && v)) er[`spec${i}`] = 'Fill both name and value, or remove the row';
      });
    }
    setE(er);
    if (Object.keys(er).length) scroll.current?.scrollTo({ y: 0, animated: true });
    return Object.keys(er).length === 0;
  };

  const save = async (publish: boolean) => {
    if (!validate(publish)) return;
    setSaving(publish ? 'Publishing listing…' : 'Saving draft…');
    try {
      await api.generic(true);
      const listing: SellerProduct = {
        id: existing?.id ?? `L-${Date.now().toString().slice(-4)}`,
        title: f.title.trim(),
        category: f.category,
        price: Number(f.price) || 0,
        mrp: Number(f.mrp) || 0,
        moq: Number(f.moq) || 0,
        unit: f.unit,
        description: f.description.trim(),
        specs: f.specs.filter(([k, v]) => k && v),
        photos: f.photos,
        cover: f.cover,
        status: publish ? (f.active ? 'active' : 'inactive') : 'draft',
        views: existing?.views ?? 0,
        enquiries: existing?.enquiries ?? 0,
        updatedAt: new Date().toISOString(),
      };
      actions.upsertListing(listing);
      disablePrevention();
      toast.show(publish ? (f.active ? 'Listing published — now visible to buyers' : 'Listing saved as inactive') : 'Saved as draft', 'success');
      router.back();
    } catch (x) {
      onError(x);
    } finally {
      setSaving(null);
    }
  };

  const del = () =>
    Alert.alert('Delete listing?', `“${existing?.title}” will be removed permanently.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          disablePrevention();
          actions.deleteListing(existing!.id);
          toast.show('Listing deleted', 'info');
          router.back();
        },
      },
    ]);

  const errCount = Object.values(e).filter(Boolean).length;

  return (
    <Screen testID="listing-form-screen">
      <AppHeader
        testID="listing-form-header"
        title={existing ? 'Edit product' : 'Add product'}
        subtitle={dirty ? 'Unsaved changes' : existing ? `Status: ${existing.status}` : undefined}
        showCart={false}
        right={existing ? (
          <Pressable testID="listing-delete-button" accessibilityLabel="Delete listing" onPress={del} style={{ padding: 10 }}>
            <Ionicons name="trash-outline" size={21} color={c.danger} />
          </Pressable>
        ) : undefined}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView ref={scroll} testID="listing-form-scroll" keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 130 }}>
          {errCount ? (
            <View testID="listing-error-summary" style={{ flexDirection: 'row', gap: 8, padding: 12, borderRadius: radius.md, backgroundColor: c.dangerSoft }}>
              <Ionicons name="alert-circle" size={18} color={c.danger} />
              <Text style={[font.small, { color: c.danger, fontWeight: '700', flex: 1 }]}>Fix {errCount} field{errCount > 1 ? 's' : ''} before publishing.</Text>
            </View>
          ) : null}

          {/* Photos */}
          <Card style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[font.h3, { color: c.text, flex: 1 }]}>Photos</Text>
              <Text testID="listing-photo-count" style={[font.small, { color: c.textMuted }]}>
                {f.photos.length}/{MAX_PHOTOS}
              </Text>
            </View>
            <Text style={[font.small, { color: c.textMuted }]}>Tap a photo to make it the cover. The cover shows in search results.</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }} testID="listing-photos">
              {f.photos.map((uri, i) => (
                <Pressable key={uri + i} testID={`listing-photo-${i}`} accessibilityLabel={`Photo ${i + 1}${f.cover === i ? ', cover' : ''}`} onPress={() => set('cover', i)} style={{ width: 92, height: 92 }}>
                  <Image source={{ uri }} style={{ width: 92, height: 92, borderRadius: 12, borderWidth: f.cover === i ? 3 : 0, borderColor: c.accent }} />
                  {f.cover === i ? (
                    <View testID={`listing-photo-cover-${i}`} style={{ position: 'absolute', left: 6, bottom: 6, backgroundColor: c.accent, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                      <Text style={[font.tiny, { color: '#2B1B00' }]}>COVER</Text>
                    </View>
                  ) : null}
                  <Pressable testID={`listing-photo-remove-${i}`} accessibilityLabel={`Remove photo ${i + 1}`} hitSlop={8} onPress={() => removePhoto(i)} style={{ position: 'absolute', right: -6, top: -6, backgroundColor: c.card, borderRadius: 12 }}>
                    <Ionicons name="close-circle" size={24} color={c.danger} />
                  </Pressable>
                </Pressable>
              ))}
              {uploading !== null ? (
                <View testID="listing-photo-uploading" style={{ width: 92, height: 92, borderRadius: 12, backgroundColor: c.cardAlt, justifyContent: 'center', padding: 10, gap: 6 }}>
                  <ProgressBar testID="listing-photo-progress" value={uploading / 100} height={6} />
                  <Text style={[font.tiny, { color: c.textMuted, textAlign: 'center' }]}>{uploading}%</Text>
                </View>
              ) : f.photos.length < MAX_PHOTOS ? (
                <Pressable
                  testID="listing-add-photo-button"
                  accessibilityRole="button"
                  accessibilityLabel="Add photo"
                  onPress={() => setSourceSheet(true)}
                  style={{ width: 92, height: 92, borderRadius: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: e.photos ? c.danger : c.border, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name="camera-outline" size={24} color={c.primary} />
                  <Text style={[font.tiny, { color: c.primary, marginTop: 4 }]}>ADD PHOTO</Text>
                </Pressable>
              ) : null}
            </ScrollView>
            {f.photos.length >= MAX_PHOTOS ? (
              <Text testID="listing-photo-limit" style={[font.small, { color: c.warning }]}>
                Photo limit reached. Remove one to add another.
              </Text>
            ) : null}
            {e.photos ? <Text testID="listing-photos-error" style={[font.small, { color: c.danger }]}>{e.photos}</Text> : null}
          </Card>

          {/* Basics */}
          <Card style={{ gap: 14 }}>
            <TextField testID="listing-title-input" label="Product title" placeholder="e.g. Premium Basmati Rice 25 kg" maxLength={TITLE_MAX} showCounter value={f.title} onChangeText={(v) => set('title', v)} error={e.title} />
            <SelectField testID="listing-category-select" label="Category" value={f.category || null} options={SELLER_CATEGORIES.map((x) => ({ value: x, label: x }))} onChange={(v) => set('category', v)} error={e.category} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextField testID="listing-price-input" label="Selling price (₹)" keyboardType="decimal-pad" value={f.price} onChangeText={(v) => set('price', v.replace(/[^0-9.]/g, ''))} error={e.price} containerStyle={{ flex: 1 }} />
              <TextField testID="listing-mrp-input" label="MRP (₹)" keyboardType="decimal-pad" value={f.mrp} onChangeText={(v) => set('mrp', v.replace(/[^0-9.]/g, ''))} error={e.mrp} containerStyle={{ flex: 1 }} />
            </View>
            {Number(f.price) > 0 && Number(f.mrp) >= Number(f.price) ? (
              <Text testID="listing-discount-preview" style={[font.small, { color: c.success, fontWeight: '700', marginTop: -6 }]}>
                Buyers will see {Math.round(((Number(f.mrp) - Number(f.price)) / Number(f.mrp)) * 100)}% off MRP
              </Text>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextField testID="listing-moq-input" label="Min. order qty" keyboardType="number-pad" value={f.moq} onChangeText={(v) => set('moq', v.replace(/[^0-9]/g, ''))} error={e.moq} containerStyle={{ flex: 1 }} />
              <View style={{ flex: 1 }}>
                <SelectField testID="listing-unit-select" label="Unit" value={f.unit} options={UNITS.map((x) => ({ value: x, label: x }))} onChange={(v) => set('unit', v)} />
              </View>
            </View>
            <TextField testID="listing-description-input" label="Description" multiline maxLength={500} showCounter value={f.description} onChangeText={(v) => set('description', v)} error={e.description} placeholder="Brand, grade, packing, shelf life, delivery terms…" />
          </Card>

          {/* Specs */}
          <Card style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[font.h3, { color: c.text, flex: 1 }]}>Specifications</Text>
              <Text testID="listing-spec-count" style={[font.small, { color: c.textMuted }]}>
                {f.specs.length}/{MAX_SPECS}
              </Text>
            </View>
            {f.specs.map(([k, v], i) => (
              <View key={i} testID={`listing-spec-row-${i}`} style={{ gap: 4 }}>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <TextInput testID={`listing-spec-key-${i}`} placeholder="Name (e.g. Origin)" placeholderTextColor={c.textFaint} value={k} onChangeText={(t) => setSpec(i, 0, t)} style={[font.body, specInput(c)]} />
                  <TextInput testID={`listing-spec-value-${i}`} placeholder="Value (e.g. Kerala)" placeholderTextColor={c.textFaint} value={v} onChangeText={(t) => setSpec(i, 1, t)} style={[font.body, specInput(c)]} />
                  <Pressable testID={`listing-spec-remove-${i}`} accessibilityLabel={`Remove specification ${i + 1}`} hitSlop={8} onPress={() => removeSpec(i)}>
                    <Ionicons name="remove-circle-outline" size={24} color={c.danger} />
                  </Pressable>
                </View>
                {e[`spec${i}`] ? <Text testID={`listing-spec-error-${i}`} style={[font.small, { color: c.danger }]}>{e[`spec${i}`]}</Text> : null}
              </View>
            ))}
            <Button testID="listing-add-spec-button" title="Add specification" icon="add" variant="outline" size="sm" disabled={f.specs.length >= MAX_SPECS} onPress={addSpec} />
          </Card>

          <Card style={{ paddingVertical: 4 }}>
            <SwitchRow testID="listing-active-switch" icon="eye-outline" label="Active (visible to buyers)" description="Turn off to hide the listing without deleting it" value={f.active} onValueChange={(v) => set('active', v)} />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 10, padding: 16, paddingBottom: insets.bottom + 12, backgroundColor: c.card, borderTopWidth: 1, borderTopColor: c.border }}>
        <Button testID="listing-save-draft-button" title="Save as draft" variant="secondary" style={{ flex: 1 }} onPress={() => save(false)} />
        <Button testID="listing-publish-button" title={existing?.status === 'active' ? 'Update' : 'Publish'} style={{ flex: 1 }} onPress={() => save(true)} />
      </View>

      <Sheet visible={sourceSheet} onClose={() => setSourceSheet(false)} title="Add photo" testID="listing-photo-source-sheet">
        <View style={{ gap: 10 }}>
          <Button testID="listing-photo-source-camera" title="Take photo" icon="camera-outline" variant="secondary" onPress={() => pickPhoto(true)} />
          <Button testID="listing-photo-source-gallery" title="Choose from gallery" icon="images-outline" variant="secondary" onPress={() => pickPhoto(false)} />
        </View>
      </Sheet>
      <ConfirmDialog
        testID="listing-discard-dialog"
        visible={!!leave}
        title="Discard changes?"
        message="Your changes to this listing haven’t been saved. Save it as a draft to keep them."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        destructive
        onCancel={() => setLeave(null)}
        onConfirm={() => {
          const go = leave;
          setLeave(null);
          go?.();
        }}
      />
      <LoadingOverlay visible={!!saving} message={saving ?? ''} />
    </Screen>
  );
}

function specInput(c: ReturnType<typeof useTheme>['c']) {
  return { flex: 1, height: 44, borderWidth: 1.5, borderColor: c.border, borderRadius: radius.md, paddingHorizontal: 10, color: c.text, backgroundColor: c.card };
}
