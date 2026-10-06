import Link from 'next/link';
import { BrandMark } from '@/components/brand-mark';
import { SupportChatWidget } from '@/components/support/support-chat';
import type { CmsDocument } from '@/data/cms-types';

export function MarketingFooter({
  footer,
  brand,
}: {
  footer: CmsDocument['footer'];
  brand: CmsDocument['brand'];
}) {
  return (
    <>
      <footer className="mkt-footer">
        <div className="mkt-wrap">
          <div className="mkt-footer-brand-row">
            <div className="mkt-footer-top">
              <BrandMark />
            </div>
            <p className="mkt-footer-mission">{footer.mission}</p>
          </div>
          <div className="mkt-footer-grid">
            {footer.columns.map((col) => (
              <div key={col.id}>
                <h2>{col.title}</h2>
                <ul>
                  {col.links.map((link) => {
                    const external = link.href.startsWith('http');
                    const muted = link.href === '/p/socials' && link.label.includes('opens after');
                    return (
                      <li key={`${col.id}-${link.label}`}>
                        {muted ? (
                          <Link href={link.href} className="mkt-footer-muted">
                            {link.label}
                          </Link>
                        ) : external ? (
                          <a href={link.href} rel="noreferrer">
                            {link.label}
                          </a>
                        ) : (
                          <Link href={link.href}>{link.label}</Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          <div className="mkt-footer-meta">
            <span>{footer.copyright}</span>
            <a href={`https://${brand.domain}`}>{brand.domain}</a>
            <span>{footer.metaNote}</span>
          </div>
        </div>
      </footer>
      <SupportChatWidget />
    </>
  );
}
