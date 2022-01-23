import Head from 'next/head';

export default function CustomError({statusCode}: {statusCode: number}) {
  return (
    <div>
      <Head>
        <title>Not Found</title>
      </Head>
      <h1>{statusCode}</h1>
      <style jsx>{`
        h1 {
          font-weight: 900;
          font-size: 36px;
          line-height: 44px;
        }
        p {
          margin: 0;
          font-size: 14px;
          line-height: 17px;
          font-weight: 400;
        }
      `}</style>
    </div>
  );
}

CustomError.getInitialProps = ({res, err}: any) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return {statusCode};
};
