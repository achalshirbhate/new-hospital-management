import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, RefreshControl } from 'react-native';
import api, { BASE_URL } from '../../api/axios';
import Card from '../../components/Card';
import { colors } from '../../theme';

export default function SocialFeedScreen() {
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try { const { data } = await api.get('/social'); setPosts(data); } catch {}
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.title}>Social Feed</Text>
      <Text style={styles.sub}>Announcements from the hospital</Text>

      {posts.map(post => (
        <Card key={post._id} style={{ padding: 0, overflow: 'hidden' }}>
          {post.imageUrl && (
            <Image source={{ uri: `${BASE_URL}${post.imageUrl}` }} style={styles.image} />
          )}
          <View style={styles.body}>
            <Text style={styles.postTitle}>{post.title}</Text>
            <Text style={styles.postContent}>{post.content}</Text>
            <View style={styles.footer}>
              <Text style={styles.avatar}>👨‍⚕️</Text>
              <View>
                <Text style={styles.author}>{post.postedBy?.name}</Text>
                <Text style={styles.date}>
                  {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
            </View>
          </View>
        </Card>
      ))}

      {posts.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📢</Text>
          <Text style={styles.emptyText}>No posts yet. Check back later.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray100, padding: 16 },
  title: { fontSize: 22, fontWeight: '800', color: colors.gray800 },
  sub: { fontSize: 13, color: colors.gray400, marginBottom: 16, marginTop: 2 },
  image: { width: '100%', height: 180 },
  body: { padding: 16 },
  postTitle: { fontSize: 17, fontWeight: '700', color: colors.gray800 },
  postContent: { fontSize: 14, color: colors.gray600, marginTop: 6, lineHeight: 21 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.gray100 },
  avatar: { fontSize: 28 },
  author: { fontSize: 13, fontWeight: '600', color: colors.gray700 },
  date: { fontSize: 11, color: colors.gray400, marginTop: 1 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, color: colors.gray400 },
});
