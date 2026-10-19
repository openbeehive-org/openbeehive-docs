import React from 'react';
import Link from '@docusaurus/Link';
import Translate, {translate} from '@docusaurus/Translate';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import {
  useVersions,
  useLatestVersion,
} from '@docusaurus/plugin-content-docs/client';

type Version = ReturnType<typeof useVersions>[number];

const changelogUrl = (version: Version) =>
  `https://github.com/openbeehive-org/openbeehive-app/blob/v${version.name}/CHANGELOG.md`;

function VersionRows({versions}: {versions: Version[]}) {
  return (
    <>
      {versions.map((version) => (
        <tr key={version.name}>
          <th>{version.label}</th>
          <td>
            <Link to={version.path}>
              <Translate id="versions.link.docs">Documentation</Translate>
            </Link>
          </td>
          <td>
            {version.name === 'current' ? (
              <span>—</span>
            ) : (
              <Link href={changelogUrl(version)}>
                <Translate id="versions.link.notes">Release notes</Translate>
              </Link>
            )}
          </td>
        </tr>
      ))}
    </>
  );
}

export default function Versions(): React.JSX.Element {
  const versions = useVersions();
  const latest = useLatestVersion();
  const next = versions.find((v) => v.name === 'current');
  const past = versions.filter((v) => v !== latest && v.name !== 'current');

  return (
    <Layout
      title={translate({id: 'versions.title', message: 'Documentation versions'})}
      description={translate({
        id: 'versions.description',
        message: 'Every Openbeehive release keeps its own copy of the documentation.',
      })}>
      <main className="container margin-vert--lg">
        <Heading as="h1">
          <Translate id="versions.title">Documentation versions</Translate>
        </Heading>
        <p>
          <Translate id="versions.intro">
            Every Openbeehive release keeps its own frozen copy of this
            documentation. Pick the version that matches the app you run; the
            newest release is what the site shows by default, and the switch in
            the navbar moves the page you are reading to another version.
          </Translate>
        </p>

        <section className="margin-bottom--lg">
          <Heading as="h2">
            <Translate id="versions.current">Current release</Translate>
          </Heading>
          <table>
            <tbody>
              <VersionRows versions={[latest]} />
            </tbody>
          </table>
        </section>

        {next && (
          <section className="margin-bottom--lg">
            <Heading as="h2">
              <Translate id="versions.next">Next (unreleased)</Translate>
            </Heading>
            <p>
              <Translate id="versions.nextIntro">
                Documentation for changes that are not part of a release yet.
                Things described here may still change before they ship.
              </Translate>
            </p>
            <table>
              <tbody>
                <VersionRows versions={[next]} />
              </tbody>
            </table>
          </section>
        )}

        {past.length > 0 && (
          <section className="margin-bottom--lg">
            <Heading as="h2">
              <Translate id="versions.past">Previous releases</Translate>
            </Heading>
            <p>
              <Translate id="versions.pastIntro">
                Frozen at the time of each release, for anyone still running an
                older app.
              </Translate>
            </p>
            <table>
              <tbody>
                <VersionRows versions={past} />
              </tbody>
            </table>
          </section>
        )}
      </main>
    </Layout>
  );
}
