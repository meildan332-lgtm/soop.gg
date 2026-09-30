import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/api/streamers': {
        target: 'https://partnership.sooplive.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/streamers/, '/api/mcnBj.php')
          .replace(/category=([^&]+)/, 'rank_type=$1')
          .replace(/pageSize=([^&]+)/, 'page_row=$1')
          .replace(/page=([^&]+)/, 'page=$1&order_by=fav_count&keyword=&sex_type=A&min_viewer=0&max_viewer=100000&min_ytb=0&max_ytb=5000000&type_sel_cnt=1')
      },
      '/api/search': {
        target: 'https://partnership.sooplive.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/search\?/, '/api/mcnBj.php?sex_type=A&rank_type=all&min_viewer=0&max_viewer=100000&min_ytb=0&max_ytb=5000000&page=1&page_row=10&order_by=accu_user_count&type_sel_cnt=1&')
      }
    }
  }
});
