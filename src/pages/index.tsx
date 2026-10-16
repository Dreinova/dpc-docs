import type {ReactNode} from 'react';
import {Redirect} from '@docusaurus/router';
import useBaseUrl from '@docusaurus/useBaseUrl';

/** El sitio es solo documentación: la portada lleva directo a la introducción. */
export default function Home(): ReactNode {
  return <Redirect to={useBaseUrl('/docs/')} />;
}
