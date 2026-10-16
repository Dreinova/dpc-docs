import type {ReactNode} from 'react';
import {Redirect} from '@docusaurus/router';

/** El sitio es solo documentación: la portada lleva directo a la introducción. */
export default function Home(): ReactNode {
  return <Redirect to="/docs/" />;
}
