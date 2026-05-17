'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useI18n } from '@/hooks/use-i18n';
import {
  Image,
  Upload,
  Ruler,
  Eye,
  RotateCcw,
  Save,
  ImageIcon,
  Type,
  Layers,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface SiteSettings {
  hero_image: string;
  hero_height: string;
  hero_title: string;
  hero_subtitle: string;
  hero_overlay_opacity: string;
}

const DEFAULT_SETTINGS: SiteSettings = {
  hero_image: '/uploads/hero-gran-canaria.png',
  hero_height: '600',
  hero_title: '',
  hero_subtitle: '',
  hero_overlay_opacity: '0.6',
};

export function AdminAppearance() {
  const { locale } = useI18n();
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [originalSettings, setOriginalSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch current settings
  useEffect(() => {
    fetch('/api/site-settings')
      .then((r) => r.json())
      .then((data) => {
        const s = { ...DEFAULT_SETTINGS, ...data };
        setSettings(s);
        setOriginalSettings(s);
      })
      .catch(() => {
        // Use defaults
      })
      .finally(() => setLoading(false));
  }, []);

  const updateSetting = useCallback((key: keyof SiteSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setOriginalSettings({ ...settings });
        toast.success(locale === 'es' ? 'Apariencia guardada correctamente' : 'Appearance saved successfully');
      } else {
        toast.error(locale === 'es' ? 'Error al guardar' : 'Failed to save');
      }
    } catch {
      toast.error(locale === 'es' ? 'Error de conexión' : 'Connection error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings({ ...originalSettings });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error(locale === 'es' ? 'Solo JPG, PNG o WebP' : 'Only JPG, PNG or WebP');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(locale === 'es' ? 'Máximo 5MB' : 'Max 5MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('purpose', 'hero');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          updateSetting('hero_image', data.url);
          toast.success(locale === 'es' ? 'Imagen subida' : 'Image uploaded');
        }
      } else {
        const err = await res.json();
        toast.error(err.error || (locale === 'es' ? 'Error al subir' : 'Upload failed'));
      }
    } catch {
      toast.error(locale === 'es' ? 'Error de conexión' : 'Connection error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const heroHeight = parseInt(settings.hero_height, 10) || 600;
  const overlayOpacity = parseFloat(settings.hero_overlay_opacity) || 0.6;

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-40 animate-pulse bg-muted rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: '#1a2e1a' }}>
            {locale === 'es' ? 'Apariencia del Sitio' : 'Site Appearance'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {locale === 'es'
              ? 'Personaliza la imagen y configuración del hero principal'
              : 'Customize the main hero image and settings'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
              <RotateCcw className="w-4 h-4" />
              {locale === 'es' ? 'Deshacer' : 'Undo'}
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Save className="w-4 h-4" />
            {saving
              ? (locale === 'es' ? 'Guardando...' : 'Saving...')
              : (locale === 'es' ? 'Guardar' : 'Save')}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="image" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="image" className="gap-1.5">
            <ImageIcon className="w-4 h-4" />
            {locale === 'es' ? 'Imagen Hero' : 'Hero Image'}
          </TabsTrigger>
          <TabsTrigger value="text" className="gap-1.5">
            <Type className="w-4 h-4" />
            {locale === 'es' ? 'Texto y Ajustes' : 'Text & Settings'}
          </TabsTrigger>
        </TabsList>

        {/* ─── Image Tab ─── */}
        <TabsContent value="image" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                {locale === 'es' ? 'Imagen de Fondo del Hero' : 'Hero Background Image'}
              </CardTitle>
              <CardDescription>
                {locale === 'es'
                  ? 'Sube una imagen panorámica para el hero principal. Se recomienda 1344x768px mínimo.'
                  : 'Upload a panoramic image for the main hero. Recommended minimum 1344x768px.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current image preview */}
              <div className="relative rounded-lg overflow-hidden border border-border">
                <div
                  className="relative w-full"
                  style={{ height: `${Math.min(heroHeight, 400)}px` }}
                >
                  <img
                    src={settings.hero_image}
                    alt="Hero preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/uploads/hero-gran-canaria.png';
                    }}
                  />
                  {/* Overlay preview */}
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30"
                    style={{ opacity: overlayOpacity / 0.6 }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  {/* Preview label */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 text-white text-xs font-medium backdrop-blur-sm">
                    <Eye className="w-3 h-3" />
                    {heroHeight}px
                  </div>
                </div>
              </div>

              {/* Upload area */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                className="hidden"
              />
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {uploading
                    ? (locale === 'es' ? 'Subiendo...' : 'Uploading...')
                    : (locale === 'es' ? 'Subir Nueva Imagen' : 'Upload New Image')}
                </Button>
                <span className="text-xs text-muted-foreground">
                  {locale === 'es' ? 'JPG, PNG, WebP — Máx 5MB' : 'JPG, PNG, WebP — Max 5MB'}
                </span>
              </div>

              {/* Or use URL */}
              <Separator />
              <div>
                <Label className="text-sm font-medium">
                  {locale === 'es' ? 'O introduce una URL externa:' : 'Or enter an external URL:'}
                </Label>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    value={settings.hero_image}
                    onChange={(e) => updateSetting('hero_image', e.target.value)}
                    placeholder="https://ejemplo.com/imagen.jpg"
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => updateSetting('hero_image', DEFAULT_SETTINGS.hero_image)}
                    title={locale === 'es' ? 'Restaurar por defecto' : 'Restore default'}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Text & Settings Tab ─── */}
        <TabsContent value="text" className="space-y-6">
          {/* Height control */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Ruler className="w-4 h-4 text-emerald-600" />
                {locale === 'es' ? 'Altura del Hero' : 'Hero Height'}
              </CardTitle>
              <CardDescription>
                {locale === 'es'
                  ? 'Ajusta la altura del hero en píxeles'
                  : 'Adjust the hero height in pixels'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Slider
                  value={[heroHeight]}
                  onValueChange={([v]) => updateSetting('hero_height', String(v))}
                  min={300}
                  max={900}
                  step={10}
                  className="flex-1"
                />
                <div className="flex items-center gap-1.5 w-24">
                  <Input
                    type="number"
                    value={heroHeight}
                    onChange={(e) => updateSetting('hero_height', e.target.value)}
                    className="h-9 w-20 text-center text-sm"
                    min={300}
                    max={900}
                  />
                  <span className="text-xs text-muted-foreground">px</span>
                </div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground px-1">
                <span>300px</span>
                <span>600px</span>
                <span>900px</span>
              </div>
            </CardContent>
          </Card>

          {/* Overlay opacity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                {locale === 'es' ? 'Opacidad del Overlay' : 'Overlay Opacity'}
              </CardTitle>
              <CardDescription>
                {locale === 'es'
                  ? 'Controla la oscuridad del overlay sobre la imagen'
                  : 'Control the darkness of the overlay on the image'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Slider
                  value={[Math.round(overlayOpacity * 100)]}
                  onValueChange={([v]) => updateSetting('hero_overlay_opacity', String(v / 100))}
                  min={0}
                  max={100}
                  step={5}
                  className="flex-1"
                />
                <div className="flex items-center gap-1.5 w-20">
                  <span className="text-sm font-medium text-center w-14">
                    {Math.round(overlayOpacity * 100)}%
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground px-1">
                <span>{locale === 'es' ? 'Sin overlay' : 'No overlay'}</span>
                <span>{locale === 'es' ? 'Muy oscuro' : 'Very dark'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Custom title */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Type className="w-4 h-4 text-emerald-600" />
                {locale === 'es' ? 'Título Personalizado' : 'Custom Title'}
              </CardTitle>
              <CardDescription>
                {locale === 'es'
                  ? 'Deja vacío para usar el título por defecto según el idioma'
                  : 'Leave empty to use the default language-aware title'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                value={settings.hero_title}
                onChange={(e) => updateSetting('hero_title', e.target.value)}
                placeholder={locale === 'es' ? 'Título personalizado del hero...' : 'Custom hero title...'}
                className="max-w-lg"
              />
            </CardContent>
          </Card>

          {/* Custom subtitle */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Type className="w-4 h-4 text-emerald-600" />
                {locale === 'es' ? 'Subtítulo Personalizado' : 'Custom Subtitle'}
              </CardTitle>
              <CardDescription>
                {locale === 'es'
                  ? 'Deja vacío para usar el subtítulo por defecto según el idioma'
                  : 'Leave empty to use the default language-aware subtitle'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                value={settings.hero_subtitle}
                onChange={(e) => updateSetting('hero_subtitle', e.target.value)}
                placeholder={locale === 'es' ? 'Subtítulo personalizado del hero...' : 'Custom hero subtitle...'}
                className="max-w-lg"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Floating save bar on mobile when changes exist */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border lg:hidden z-50">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            <Save className="w-4 h-4" />
            {saving
              ? (locale === 'es' ? 'Guardando...' : 'Saving...')
              : (locale === 'es' ? 'Guardar Cambios' : 'Save Changes')}
          </Button>
        </div>
      )}
    </div>
  );
}
