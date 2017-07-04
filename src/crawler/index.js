import IndexAV from './indexav';
import database from './mongodb';
import YouAV from './AV/youav';
import MyAVSuper from './AV/myavsuper';
import Avgle from './AV/avgle';

const test = async () => {
  const avs = [new YouAV(), new MyAVSuper(), new Avgle()];

  const db = await database();
  const searchs = await db.collection('search_keywords').find().sort({ count: -1 }).toArray();

  for (const search of searchs) {
    console.log(`search keyword: ${search.keyword}`);

    for (const av of avs) {
      console.log(`search from av: ${av.constructor.name}`);
      const videos = await av.getVideos(search.keyword);

      const indexav = new IndexAV();
      const infos = [];

      for (const each of videos) {
        const code = each.code;
        const info = await indexav.getCodeInfo(code);

        if (info.title !== '') {
          infos.push({ ...info, ...each });
        }
      }

      await Promise.all(
        infos.map(async info => {
          await db.collection('videos').updateOne({ url: info.url }, info, { upsert: true });
        }),
      );

      console.log(`video url count: ${infos.length}`);
    }

    break;
  }
};

test();