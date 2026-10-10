import Link from 'next/link';
import { WEB_BILLING_PLANS } from '@/data/billing-plans';

export function PricingTeaser() {
  const plans = WEB_BILLING_PLANS.slice(0, 4);

  return (
    <section className="mkt-section mkt-pricing-teaser-section" id="pricing-teaser" aria-labelledby="mkt-pricing-teaser-title">
      <div className="mkt-wrap">
        <div className="mkt-pricing-teaser-head">
          <p className="mkt-kicker">Transparent Quotas</p>
          <h2 className="mkt-h2" id="mkt-pricing-teaser-title">
            Simple, honest pricing for developers &amp; teams
          </h2>
          <p className="mkt-lede">
            Build AI agents that speak and talk across languages and accents. No hidden multipliers or confusing credit conversions.
          </p>
        </div>

        <div className="mkt-pricing-teaser-grid">
          {plans.map((p) => {
            const isHighlight = p.highlight;
            return (
              <div
                key={p.id}
                className={`mkt-pricing-teaser-card${isHighlight ? ' is-highlight' : ''}`}
              >
                {isHighlight && (
                  <span className="mkt-pricing-badge">Most Popular</span>
                )}
                <div className="mkt-pricing-teaser-top">
                  <h3 className="mkt-pricing-plan-name">{p.name}</h3>
                  <div className="mkt-pricing-price-row">
                    <span className="mkt-pricing-price">{p.priceLabel}</span>
                    {p.priceMonthlyUsd !== null && p.priceMonthlyUsd > 0 && (
                      <span className="mkt-pricing-period">/month</span>
                    )}
                  </div>
                  <p className="mkt-pricing-blurb">{p.blurb}</p>
                </div>

                <div className="mkt-pricing-quota-pill">
                  <strong>{p.characterQuota.toLocaleString()}</strong> characters/mo
                </div>

                <div className="mkt-pricing-teaser-cta">
                  <Link
                    href={p.id === 'enterprise' ? '/enterprise' : p.id === 'free' ? '/sign-up' : `/pricing?plan=${p.id}`}
                    className={`vl-btn ${isHighlight ? 'vl-btn-primary' : 'vl-btn-secondary'} mkt-pricing-btn`}
                  >
                    {p.id === 'enterprise' ? 'Contact enterprise' : p.id === 'free' ? 'Get started free' : `Choose ${p.name}`}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mkt-pricing-teaser-foot">
          <p>
            Looking for custom voice training, dedicated regional pods, or enterprise SLAs?{' '}
            <Link href="/enterprise" className="mkt-text-link">
              Explore Lugemi Enterprise →
            </Link>
          </p>
          <Link href="/pricing" className="mkt-pricing-view-all">
            Compare all 4 plans &amp; full feature breakdown →
          </Link>
        </div>
      </div>
    </section>
  );
}
