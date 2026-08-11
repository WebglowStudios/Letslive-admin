"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Save, Loader2, ImagePlus } from "lucide-react";

export default function AboutCMSPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<any>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await api.get('/about');
        setContent(res.data.data);
      } catch (error) {
        console.error("Failed to load about content", error);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  const handleChange = (section: string, field: string, value: any) => {
    setContent((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/about', content);
      alert("Content saved successfully!");
    } catch (error) {
      console.error("Failed to save", error);
      alert("Failed to save content");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, section: string, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("image", file);
      
      const res = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      handleChange(section, field, res.data.imageUrl);
    } catch (error) {
      console.error("Upload failed", error);
      alert("Image upload failed");
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-slate-500" /></div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">About Page Content</h1>
          <p className="text-slate-400 text-sm mt-1">Manage the content shown on the public About page.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Save Changes
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 bg-slate-800/50">
          <h2 className="font-semibold text-white">Hero Section</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Title</label>
            <input type="text" value={content.hero?.title || ""} onChange={e => handleChange('hero', 'title', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Subtitle</label>
            <textarea rows={3} value={content.hero?.subtitle || ""} onChange={e => handleChange('hero', 'subtitle', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Background Image</label>
            <div className="flex items-center gap-4">
              <img src={content.hero?.bgImage || "/placeholder.jpg"} className="w-32 h-20 object-cover rounded-lg border border-slate-800" />
              <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                <ImagePlus size={16} /> Upload New
                <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'hero', 'bgImage')} />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 bg-slate-800/50">
          <h2 className="font-semibold text-white">Our Story</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Founded Year</label>
              <input type="text" value={content.story?.year || ""} onChange={e => handleChange('story', 'year', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Title</label>
              <input type="text" value={content.story?.title || ""} onChange={e => handleChange('story', 'title', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Paragraph 1</label>
            <textarea rows={3} value={content.story?.text || ""} onChange={e => handleChange('story', 'text', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Paragraph 2</label>
            <textarea rows={3} value={content.story?.text2 || ""} onChange={e => handleChange('story', 'text2', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Paragraph 3</label>
            <textarea rows={3} value={content.story?.text3 || ""} onChange={e => handleChange('story', 'text3', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Side Image</label>
            <div className="flex items-center gap-4">
              <img src={content.story?.image || "/placeholder.jpg"} className="w-24 h-24 object-cover rounded-lg border border-slate-800" />
              <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                <ImagePlus size={16} /> Upload New
                <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'story', 'image')} />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 bg-slate-800/50">
            <h2 className="font-semibold text-white">Our Vision</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Title</label>
              <input type="text" value={content.vision?.title || ""} onChange={e => handleChange('vision', 'title', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
              <textarea rows={4} value={content.vision?.text || ""} onChange={e => handleChange('vision', 'text', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 bg-slate-800/50">
            <h2 className="font-semibold text-white">Our Mission</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Title</label>
              <input type="text" value={content.mission?.title || ""} onChange={e => handleChange('mission', 'title', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
              <textarea rows={4} value={content.mission?.text || ""} onChange={e => handleChange('mission', 'text', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 bg-slate-800/50">
          <h2 className="font-semibold text-white">Statistics</h2>
        </div>
        <div className="p-6 grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Years Active</label>
            <input type="number" value={content.stats?.years || 0} onChange={e => handleChange('stats', 'years', Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Destinations</label>
            <input type="number" value={content.stats?.destinations || 0} onChange={e => handleChange('stats', 'destinations', Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Happy Travelers</label>
            <input type="number" value={content.stats?.travelers || 0} onChange={e => handleChange('stats', 'travelers', Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Partners</label>
            <input type="number" value={content.stats?.partners || 0} onChange={e => handleChange('stats', 'partners', Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white" />
          </div>
        </div>
      </div>

    </div>
  );
}
