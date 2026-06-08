"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import Link from "next/link";

interface Article {
  _id: string;
  title: string;
  slug: string;
  category: string;
  author?: { firstName: string; lastName: string };
  isPublished: boolean;
  readTime: number;
  createdAt: string;
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/articles/all").then((res) => setArticles(res?.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this article?")) return;
    const res = await api.del(`/articles/${id}`);
    if (res?.status === "success") setArticles((prev) => prev.filter((a) => a._id !== id));
  }

  async function togglePublish(id: string, current: boolean) {
    await api.put(`/articles/${id}`, { isPublished: !current });
    setArticles((prev) => prev.map((a) => a._id === id ? { ...a, isPublished: !current } : a));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Articles</h1>
          <p className="text-xs text-slate-400">Stories from the Road — blog content management</p>
        </div>
        <Link href="/articles/new" className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 text-white rounded-lg text-sm font-semibold hover:bg-cyan-700">
          <Plus size={16} /> New Article
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">
              <th className="px-6 py-3">Title</th>
              <th className="px-6 py-3">Category</th>
              <th className="px-6 py-3">Author</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">Loading...</td></tr>
            ) : articles.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">No articles yet</td></tr>
            ) : (
              articles.map((a) => (
                <tr key={a._id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-700 max-w-[250px] truncate">{a.title}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 capitalize">{a.category}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{a.author ? `${a.author.firstName} ${a.author.lastName}` : "—"}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => togglePublish(a._id, a.isPublished)} className={`px-2.5 py-1 rounded-full text-xs font-semibold ${a.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {a.isPublished ? "Published" : "Draft"}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{formatDate(a.createdAt)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {a.isPublished && (
                        <a href={`https://letslivetours.com/articles/${a.slug}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600"><Eye size={16} /></a>
                      )}
                      <Link href={`/articles/${a._id}/edit`} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-cyan-600"><Edit size={16} /></Link>
                      <button onClick={() => handleDelete(a._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
