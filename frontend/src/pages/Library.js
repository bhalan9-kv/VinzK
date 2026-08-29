import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cases as casesApi, bookmarks as bmApi } from '../api';
import { motion } from 'framer-motion';

const TYPE_COLORS = {
  profitability: 'tag-green',
  market_entry: 'tag-cyan',
  gtm: 'tag-purple',
  dd_ma: 'tag-magenta',
  guesstimate: 'tag-amber',
  unconventional: 'tag-red',
  revenues: 'tag-cyan',
  cost_reduction: 'tag-green',
  growth: 'tag-purple',
  pricing: 'tag-magenta',
  customer_satisfaction: 'tag-amber',
};

const TYPE_LABELS = {
  profitability: 'Profitability',
  market_entry: 'Market Entry',
  gtm: 'GTM',
  dd_ma: 'DD / M&A',
  guesstimate: 'Guesstimate',
  unconventional: 'Unconventional',
  revenues: 'Revenues',
  cost_reduction: 'Cost Reduction',
  growth: 'Growth',
  pricing: 'Pricing',
  customer_satisfaction: 'Customer Satisfaction',
};

const DIFF_COLORS = { easy: 'tag-green', medium: 'tag-amber', hard: 'tag-red' };

export default function Library() {
  const [caseList, setCaseList] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [diffFilter, setDiffFilter] = useState('all');
  const [tab, setTab] = useState('all'); // all | bookmarked
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([casesApi.list(), bmApi.list()]).then(([c, b]) => {
      setCaseList(c.cases);
      setFiltered(c.cases);
      setBookmarkedIds(new Set(b.bookmarks));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let list = [...caseList];
    if (tab === 'bookmarked') list = list.filter(c => bookmarkedIds.has(c.id));
    if (typeFilter !== 'all') list = list.filter(c => c.type === typeFilter);
    if (diffFilter !== 'all') list = list.filter(c => c.difficulty === diffFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => c.title.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q));
    }
    setFiltered(list);
  }, [search, typeFilter, diffFilter, tab, caseList, bookmarkedIds]);

  const toggleBookmark = async (caseId) => {
    const next = new Set(bookmarkedIds);
    if (next.has(caseId)) {
      next.delete(caseId);
      await bmApi.remove(caseId);
    } else {
      next.add(caseId);
      await bmApi.add(caseId);
    }
    setBookmarkedIds(next);
  };

  const types = [...new Set(caseList.map(c => c.type))].sort();

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', padding: '40px 0' }}>
      <div className="container">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: '8px' }}>
            Case Library
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
            {caseList.length} cases across {types.length} categories
          </p>
        </motion.div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {['all', 'bookmarked'].map(t => (
            <button
              key={t}
              className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTab(t)}
            >
              {t === 'all' ? 'All Cases' : `★ Bookmarked (${bookmarkedIds.size})`}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
          <input
            className="input"
            placeholder="Search cases..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: '300px' }}
          />
          <select
            className="input"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            style={{ maxWidth: '200px', cursor: 'pointer' }}
          >
            <option value="all">All Types</option>
            {types.map(t => <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>)}
          </select>
          <select
            className="input"
            value={diffFilter}
            onChange={e => setDiffFilter(e.target.value)}
            style={{ maxWidth: '160px', cursor: 'pointer' }}
          >
            <option value="all">All Levels</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        {/* Case grid */}
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading cases...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '3rem', marginBottom: '16px' }}>📭</p>
            <p>No cases found matching your filters.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
            {filtered.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="card card-glow"
                style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}
              >
                {/* Bookmark button */}
                <button
                  onClick={() => toggleBookmark(c.id)}
                  style={{
                    position: 'absolute', top: '16px', right: '16px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '1.2rem', color: bookmarkedIds.has(c.id) ? 'var(--amber)' : 'var(--text-muted)',
                    transition: 'color 0.2s',
                  }}
                >
                  {bookmarkedIds.has(c.id) ? '★' : '☆'}
                </button>

                {/* Tags */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <span className={`tag ${TYPE_COLORS[c.type] || 'tag-cyan'}`}>
                    {TYPE_LABELS[c.type] || c.type}
                  </span>
                  <span className={`tag ${DIFF_COLORS[c.difficulty] || 'tag-cyan'}`}>
                    {c.difficulty}
                  </span>
                </div>

                {/* Content */}
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '6px', paddingRight: '28px' }}>
                  {c.title}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '12px' }}>{c.company}</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, flex: 1 }}>
                  {c.context?.substring(0, 150)}{c.context?.length > 150 ? '...' : ''}
                </p>

                {/* CTA */}
                <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                  <Link to={`/interview/${c.id}`} style={{ flex: 1 }}>
                    <button className="btn btn-primary" style={{ width: '100%' }}>
                      Start Interview →
                    </button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
