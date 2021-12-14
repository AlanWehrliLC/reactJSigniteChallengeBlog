import { useRouter } from 'next/router';
import { GetStaticPaths, GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import Head from 'next/head';

import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { RichText } from 'prismic-dom';

import { getPrismicClient } from '../../services/prismic';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import styles from './post.module.scss';
import Link from 'next/link';
import Comments from '../../components/Comments';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

type navigation = {
  prevPost: {
    uid: string;
    data: {
      title: string;
    };
  }[];
  nextPost: {
    uid: string;
    data: {
      title: string;
    };
  }[];
};

interface PostProps {
  post: Post;
  preview: boolean;
  navigation: navigation;
}

export default function Post({ post, preview, navigation }: PostProps) {
  const router = useRouter();

  const readingTime = post.data.content.reduce((acc, content) => {
    const textBody = RichText.asText(content.body)
      .split(/<.+?>(.+?)<\/.+?>/g)
      .filter(t => t);

    const ar = [];
    textBody.forEach(fr => {
      fr.split(' ').forEach(pl => {
        ar.push(pl);
      });
    });

    const min = Math.ceil(ar.length / 200);
    return acc + min;
  }, 0);

  const formatedDate = format(
    new Date(post.first_publication_date),
    'dd MMM yyyy',
    {
      locale: ptBR,
    }
  );

  const isPostEdited =
    post.first_publication_date !== post.last_publication_date;

  let editionDate;
  if (isPostEdited) {
    editionDate = format(
      new Date(post.last_publication_date),
      "'* editado em' dd MMM yyyy', às' H':'m",
      {
        locale: ptBR,
      }
    );
  }

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <Head>
        <title>{post.data.title} | Spacetraveling</title>
      </Head>
      <main className={styles.container}>
        <article className={styles.post}>
          <img src={post.data.banner.url} alt={post.data.title} />
          <div className={styles.postContent}>
            <h1>{post.data.title}</h1>
            <div className={styles.timeContainer}>
              <div>
                <FiCalendar />
                <time>
                  {formatedDate}
                </time>
              </div>
              <div>
                <FiUser /> {post.data.author}
              </div>
              <div>
                <FiClock /> {readingTime} min
              </div>
              
            </div>
            
            {isPostEdited && <span className={styles.editionDate}>{editionDate}</span>}

            {post.data.content.map(contentBody => (
              <div key={contentBody.heading}>
                <strong>{contentBody.heading}</strong>
                <div
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(contentBody.body),
                  }}
                />
              </div>
            ))}

            <section
              className={`${styles.navigation} ${styles.containerNavigation}`}
            >
              {navigation?.prevPost.length > 0 && (
                <div>
                  <h3>{navigation.prevPost[0].data.title}</h3>
                  <Link href={`/post/${navigation.prevPost[0].uid}`}>
                    <a>Post anterior</a>
                  </Link>
                </div>
              )}

              {navigation?.nextPost.length > 0 && (
                <div>
                  <h3>{navigation.nextPost[0].data.title}</h3>
                  <Link href={`/post/${navigation.nextPost[0].uid}`}>
                    <a>Próximo post</a>
                  </Link>
                </div>
              )}
            </section>

            <Comments />

            {preview && (
              <aside>
                <Link href="/api/exit-preview">
                  <a className={styles.preview}>Sair do modo Preview</a>
                </Link>
              </aside>
            )}
          </div>
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      fetch: ['post.uid'],
      pageSize: 100,
    }
  );

  const postsPath = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths: postsPath,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref || null,
  });

  const prevPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]',
    }
  );

  const nextPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.last_publication_date desc]',
    }
  );

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content,
    },
  };

  return {
    props: {
      post,
      navigation: {
        prevPost: prevPost?.results,
        nextPost: nextPost?.results,
      },
      preview,
    },
    revalidate: 1800,
  };
};
