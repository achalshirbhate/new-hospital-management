import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function SocialFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/social')
      .then(r => setPosts(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-400 text-sm">Loading feed...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Social Feed</h2>
      <p className="text-gray-500 text-sm mb-6">Updates and announcements from the hospital.</p>

      <div className="space-y-5">
        {posts.map(post => (
          <div key={post._id} className="bg-white rounded-xl shadow-sm overflow-hidden">
            {post.imageUrl && (
              <img
                src={`http://localhost:5000${post.imageUrl}`}
                alt={post.title}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-5">
              <h3 className="font-semibold text-gray-800 text-lg">{post.title}</h3>
              <p className="text-gray-600 text-sm mt-2 leading-relaxed">{post.content}</p>
              <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-xs">👨‍⚕️</div>
                <div>
                  <p className="text-xs font-medium text-gray-700">{post.postedBy?.name}</p>
                  <p className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
        {posts.length === 0 && (
          <div className="bg-white rounded-xl p-10 text-center text-gray-400">
            <div className="text-4xl mb-2">📢</div>
            <p>No posts yet. Check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
}
