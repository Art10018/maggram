import http from "./http";

/**
 * Пробуем несколько путей, чтобы не ломать проект при разных версиях backend.
 * 404 -> пробуем следующий.
 */
export async function toggleLikeApi(postId) {
  const paths = [
    `/likes/${postId}/toggle`,
    `/likes/toggle/${postId}`,
    `/posts/${postId}/like`,
    `/posts/${postId}/toggle-like`,
  ];

  let lastErr = null;

  for (const url of paths) {
    try {
      return await http.post(url);
    } catch (e) {
      const status = e?.response?.status;
      if (status === 404) {
        lastErr = e;
        continue;
      }
      throw e; // если не 404 — это уже настоящая ошибка
    }
  }

  throw lastErr || new Error("Like endpoint not found (404)");
}
