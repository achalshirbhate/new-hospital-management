import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function SocialFeedManager() {
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState({ title: '', content: '' });
  const [image, setImage] = useState(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const load = () => api.get('/social').then(r => setPosts(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const handlePost = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('content', form.content);
      if (image) fd.append('image', image);
      await api.post('/social', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMsg('Post published!');
      setForm({ title: '', content: '' });
      setImage(null);
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to post');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this post?')) return;
    await api.delete(`/social/${id}`);
    load();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Social Feed</h2>

      {/* Compose */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-8">
        <h3 className="font-semibold text-gray-700 mb-4">📢 New Post</h3>
        {msg && <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-3 text-sm">{msg}</div>}
        <form onSubmit={handlePost} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              required
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Post title..."
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea
              required rows={4}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Write your announcement or update..."
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image (optional)</label>
            <input
              type="file" accept=".jpg,.jpeg,.png"
              className="text-sm"
              onChange={e => setImage(e.target.files[0])}
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium text-sm disabled:opacity-50"
          >
            {loading ? 'Publishing...' : '📤 Publish Post'}
          </button>
        </form>
      </div>

      {/* Posts list */}
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Published Posts</h3>
      <div className="space-y-4">
        {posts.map(post => (
          <div key={post._id} className="bg-white rounded-xl shadow-sm overflow-hidden">
            {post.imageUrl && (
              <img src={`http://localhost:5000${post.imageUrl}`} alt={post.title} className="w-full h-40 object-cover" />
            )}
            <div className="p-4 flex items-start justify-between">
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{post.title}</p>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{post.content}</p>
                <p className="text-xs text-gray-400 mt-2">{new Date(post.createdAt).toLocaleDateString()}</p>
              </div>
              <button
                onClick={() => handleDelete(post._id)}
                className="text-red-400 hover:text-red-600 ml-4 text-sm"
              >
                🗑 Delete
              </button>
            </div>
          </div>
        ))}
        {posts.length === 0 && <p className="text-gray-400 text-sm">No posts yet.</p>}
      </div>
    </div>
  );
}
