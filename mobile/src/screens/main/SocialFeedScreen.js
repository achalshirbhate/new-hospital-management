import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, Alert, Image, RefreshControl
} from 'react-native';
import api, { BASE_URL } from '../../api/axios';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { colors } from '../../theme';

export default function SocialFeedScreen() {
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    try { const { data } = await api.get('/social'); setPosts(data); } catch {}
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handlePost = async () => {
    if (!form.title || !form.content) return Alert.alert('Error', 'Fill in title and content');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('content', form.content);
      await api.post('/social', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm({ title: '', content: '' });
      setShowForm(false);
      load();
    } catch { Alert.alert('Error', 'Failed to post'); }
    finally { setLoading(false); }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Post', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await api.delete(`/social/${id}`); load(); } }
    ]);
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.topRow}>
        <Text style={styles.title}>Social Feed</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)} style={styles.addBtn}>
          <Text style={styles.addBtnText}>{showForm ? '✕ Cancel' : '+ New Post'}</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <Card>
          <Text style={styles.formTitle}>📢 New Announcement</Text>
          <TextInput
            style={styles.input}
            placeholder="Post title..."
            placeholderTextColor={colors.gray400}
            value={form.title}
            onChangeText={v => setForm({ ...form, title: v })}
          />
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Write your message..."
            placeholderTextColor={colors.gray400}
            multiline
            numberOfLines={4}
            value={form.content}
            onChangeText={v => setForm({ ...form, content: v })}
          />
          <Button title="Publish Post" onPress={handlePost} loading={loading} />
        </Card>
      )}

      {posts.map(post => (
        <Card key={post._id} style={{ padding: 0, overflow: 'hidden' }}>
          {post.imageUrl && (
            <Image source={{ uri: `${BASE_URL}${post.imageUrl}` }} style={styles.postImage} />
          )}
          <View style={styles.postBody}>
            <Text style={styles.postTitle}>{post.title}</Text>
            <Text style={styles.postContent}>{post.content}</Text>
            <View style={styles.postFooter}>
              <Text style={styles.postMeta}>
                {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={() => handleDelete(post._id)}>
                <Text style={styles.deleteBtn}>🗑 Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>
      ))}
      {posts.length === 0 && !showForm && <Text style={styles.empty}>No posts yet. Create your first announcement!</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray100, padding: 16 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: colors.gray800 },
  addBtn: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  formTitle: { fontSize: 15, fontWeight: '700', color: colors.gray800, marginBottom: 12 },
  input: { borderWidth: 1.5, borderColor: colors.gray200, borderRadius: 10, padding: 12, fontSize: 14, color: colors.gray800, marginBottom: 12 },
  textarea: { height: 100, textAlignVertical: 'top' },
  postImage: { width: '100%', height: 180 },
  postBody: { padding: 16 },
  postTitle: { fontSize: 16, fontWeight: '700', color: colors.gray800 },
  postContent: { fontSize: 14, color: colors.gray600, marginTop: 6, lineHeight: 20 },
  postFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.gray100 },
  postMeta: { fontSize: 12, color: colors.gray400 },
  deleteBtn: { fontSize: 12, color: colors.danger },
  empty: { textAlign: 'center', color: colors.gray400, marginTop: 40 },
});
