"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import ListInput from "@/components/ui/ListInput";
import ImageUpload from "@/components/ui/ImageUpload";

const RichTextEditor = dynamic(() => import("@/components/ui/RichTextEditor"), { ssr: false });

interface Dest { _id: string; name: string }

export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
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
    api.get("/destinations?limit=100").then((res) => setDestinations(res?.data || [])).catch(() => {});
    api.get(`/articles/${id}`).then((res) => {
      const a = res?.data;
      if (a) {
        setTitle(a.title || "");
        setExcerpt(a.excerpt || "");
        setContent(a.content || "");
        setCoverImage(a.coverImage || "");
        setCategory(a.category || "travel");
        setDestination(typeof a.destination === "object" ? a.destination?._id || "" : a.destination || "");
        setTags(a.tags || []);
        setIsPublished(a.isPublished || false);
      }
    }).catch(() => setError("Failed to load")).finally(() => setFetching(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content || content === "<p></p>") {
      setError("Article content is required.");
      return;
    }
    setLoading(true); setError(""); setSuccess("");
    try {
      const res = await api.put(`/articles/${id}`, { title, excerpt, content, coverImage, category, destination: destination || undefined, tags, isPublished });
      if (res?.status === "success") {
        setSuccess("Article updated!");
        setTimeout(() => router.push("/articles"), 1500);
      } else { setError(res?.message || "Failed"); }
    } catch { setError("Failed to update"); }
    finally { setLoading(false); }
  }

  if (fetching) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-cyan-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/articles" className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Edit Article</h1>
          <p className="text-sm text-slate-500">Update article content and formatting</p>
        </div>
      </div>

      {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}
      {success && <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Meta info */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Title *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full px-4 py-3 border border-slate-200 rounded-xl text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Excerpt *</label>
            <input type="text" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} required className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
          </div>
          <div>
            <ImageUpload value={coverImage} onChange={setCoverImage} label="Cover Image" folder="articles" />
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
              <span className="text-sm text-slate-700">Published</span>
            </label>
          </div>
          <ListInput label="Tags" items={tags} onChange={setTags} placeholder="Add a tag (e.g. Dubai, Bali)" />
        </div>

        {/* Content editor */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-700">Article Content *</label>
            <p className="text-[11px] text-slate-400">Use the toolbar to format text, insert images, add tables, and more</p>
          </div>
          {content !== undefined && (
            <RichTextEditor content={content} onChange={setContent} placeholder="Continue writing..." />
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={loading} className="px-6 py-3 bg-cyan-600 text-white rounded-xl font-semibold hover:bg-cyan-700 disabled:opacity-50 flex items-center gap-2">
            <Save size={16} /> {loading ? "Saving..." : "Save Changes"}
          </button>
          <Link href="/articles" className="px-6 py-3 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
