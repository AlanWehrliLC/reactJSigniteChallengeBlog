import Document, { Html, Head, Main, NextScript } from 'next/document';
const repoName = process.env.REPO_NAME

export default class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx)
    return { ...initialProps }
  }
  render() {
    return (
      <Html>
        <Head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"
            rel="stylesheet"
          />
          
        </Head>
        <body>
          <Main />
          <NextScript />
          <script async defer src={`//static.cdn.prismic.io/prismic.js?repo=${repoName}&new=true`}></script>
        </body>
      </Html>
    );
  }
}
