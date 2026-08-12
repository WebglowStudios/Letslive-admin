"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import ListInput from "@/components/ui/ListInput";
import ImageUpload from "@/components/ui/ImageUpload";

const RichTextEditor = dynamic(() => import("@/components/ui/RichTextEditor"), { ssr: false });

interface Dest { _id: string; name: string }

export default function NewArticlePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [destinations, setDestinations] = useState<Dest[]>([]);

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [category, setCategory] = useState("travel");
  const [destination, setDestination] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    api.get("/destinations?limit=100&admin=true").then((res) => setDestinations(res?.data || [])).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content || content === "<p></p>") {
      setError("Article content is required.");
      return;
    }
    setLoading(true); setError(""); setSuccess("");
    try {
      const res = await api.post("/articles", { title, excerpt, content, coverImage, category, destination: destination || undefined, tags, isPublished });
      if (res?.status === "success") {
        setSuccess("Article created!");
        setTimeout(() => router.push("/articles"), 1500);
      } else { setError(res?.message || "Failed"); }
    } catch { setError("Failed to create"); }
    finally { setLoading(false); }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/articles" className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="text-xl font-bold text-slate-800">New Article</h1>
          <p className="text-sm text-slate-500">Write a new story with rich content — images, formatting, tables, and more</p>
        </div>
      </div>

      {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}
      {success && <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Meta info card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Title *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full px-4 py-3 border border-slate-200 rounded-xl text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Your article title..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Excerpt *</label>
            <input type="text" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} required className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Short summary shown on article cards and SEO descriptions..." />
          </div>
          <div>
            <ImageUpload value={coverImage} onChange={setCoverImage} label="Cover Image (featured thumbnail)" folder="articles" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500">
                <option value="travel">Travel</option>
                <option value="destination">Destination Guide</option>
                <option value="tips">Travel Tips</option>
                <option value="culture">Culture</option>
                <option value="honeymoon">Honeymoon</option>
                <option value="luxury">Luxury</option>
                <option value="adventure">Adventure</option>
                <option value="food">Food & Dining</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Destination (optional)</label>
              <select value={destination} onChange={(e) => setDestination(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500">
                <option value="">No specific destination</option>
                {destinations.map((d) => (<option key={d._id} value={d._id}>{d.name}</option>))}
              </select>
            </div>
          </div>
          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-cyan-600" />
              <span className="text-sm text-slate-700">Publish immediately</span>
            </label>
          </div>
          <ListInput label="Tags (used for filtering on destination pages)" items={tags} onChange={setTags} placeholder="Add a tag (e.g. Dubai, Bali, honeymoon)" />
        </div>

        {/* Content editor */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-700">Article Content *</label>
            <p className="text-[11px] text-slate-400">Use the toolbar to format text, insert images, add tables, and more</p>
          </div>
          <RichTextEditor content={content} onChange={setContent} placeholder="Start writing your article here... Use the toolbar above to add headings, images, tables, and formatting." />
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={loading} className="px-6 py-3 bg-cyan-600 text-white rounded-xl font-semibold hover:bg-cyan-700 disabled:opacity-50 flex items-center gap-2">
            <Save size={16} /> {loading ? "Creating..." : "Publish Article"}
          </button>
          <Link href="/articles" className="px-6 py-3 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
