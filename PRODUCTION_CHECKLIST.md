# Production Deployment Checklist

## Pre-Deployment

### Database
- [ ] Backup production database
- [ ] Run database migrations on staging first
- [ ] Verify all tables created with correct schemas
- [ ] Check indexes are created
- [ ] Verify RLS policies are enabled
- [ ] Test with sample data

### Code Quality
- [ ] Run `npm run type-check` - all types pass
- [ ] Run `npm run build` - no build errors
- [ ] Check for console.error/console.warn in production code
- [ ] Remove any debug code or console logs
- [ ] Code review completed

### Security
- [ ] Environment variables set correctly
- [ ] No secrets in version control
- [ ] Supabase RLS policies verified
- [ ] CORS settings configured
- [ ] Authentication flows tested

### Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing on staging
- [ ] Cross-browser testing
- [ ] Mobile responsiveness verified
- [ ] Performance testing done

### Performance
- [ ] Bundle size analyzed
- [ ] Critical paths optimized
- [ ] Caching strategy verified
- [ ] CDN configured
- [ ] Compression enabled

### Monitoring
- [ ] Error tracking service configured
- [ ] Logging infrastructure ready
- [ ] Performance monitoring setup
- [ ] Alerting rules configured
- [ ] Dashboard created for monitoring

## Deployment

### Before Going Live
- [ ] Create backup of production
- [ ] Prepare rollback plan
- [ ] Notify users of any downtime
- [ ] Schedule deployment for low-traffic time

### During Deployment
- [ ] Deploy to production
- [ ] Run smoke tests
- [ ] Check error logs
- [ ] Monitor key metrics
- [ ] Verify database connections

### After Deployment
- [ ] Monitor error rates
- [ ] Check user feedback
- [ ] Verify all features work
- [ ] Monitor performance metrics
- [ ] Check database query performance

## Post-Deployment

### First Week
- [ ] Daily monitoring of error logs
- [ ] Monitor user engagement
- [ ] Check for new issues
- [ ] Performance metrics stable
- [ ] No critical bugs reported

### First Month
- [ ] All metrics within expected ranges
- [ ] User satisfaction high
- [ ] No major issues found
- [ ] Documentation updated
- [ ] Lessons learned documented

## Environment Configuration

### `.env.local` (Development)
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### Production Environment Variables
- Set in Supabase/Cloudflare/etc. dashboard
- Use separate keys for production
- Rotate keys regularly
- Never commit to version control

## Database Optimization

### Indexes Verification
```sql
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY indexname;
```

### Performance Monitoring
```sql
SELECT 
  query,
  mean_time,
  calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### Connection Pool Settings
- Max connections: configured by Supabase
- Connection timeout: 30 seconds
- Idle timeout: 5 minutes

## Scaling Considerations

### If Traffic Increases
- [ ] Monitor query performance
- [ ] Add more indexes if needed
- [ ] Consider caching strategy
- [ ] Use CDN for static assets
- [ ] Implement rate limiting

### Database Scaling
- [ ] Monitor connection usage
- [ ] Review slow queries
- [ ] Optimize N+1 queries
- [ ] Archive old data if needed

## Disaster Recovery

### Backup Strategy
- Daily automated backups
- Weekly manual backups
- Test restore process monthly
- Keep backups for at least 30 days

### Recovery Plan
- RTO (Recovery Time Objective): 1 hour
- RPO (Recovery Point Objective): 1 day
- Test recovery process monthly

## Security Maintenance

### Regular Tasks
- [ ] Update dependencies monthly
- [ ] Review security advisories
- [ ] Rotate secrets/keys quarterly
- [ ] Audit access logs
- [ ] Review RLS policies

### Security Audits
- [ ] OWASP Top 10 review
- [ ] Dependency vulnerability scan
- [ ] Manual security testing
- [ ] Penetration testing (annually)

## Documentation

### Keep Updated
- [ ] README with setup instructions
- [ ] Architecture documentation
- [ ] API documentation
- [ ] Database schema documentation
- [ ] Troubleshooting guide

### Runbooks
- [ ] Deployment runbook
- [ ] Rollback procedures
- [ ] Emergency procedures
- [ ] Monitoring/alerting runbook

## Monitoring Metrics

### Key Metrics to Watch
- Page load time (target: < 2s)
- Error rate (target: < 0.1%)
- API latency (target: < 200ms)
- Database connection pool usage
- Memory usage
- CPU usage

### Alerts to Set Up
- Error rate > 1%
- API latency > 1000ms
- Database connection pool > 80%
- Memory usage > 80%
- CPU usage > 80%
- Uptime < 99.9%

## Release Management

### Release Process
1. Create release branch
2. Update version number
3. Update CHANGELOG
4. Create release notes
5. Tag release in git
6. Build and test artifacts
7. Deploy to staging
8. Run full test suite
9. Deploy to production
10. Announce release

### Version Numbering
- Semantic versioning: MAJOR.MINOR.PATCH
- MAJOR: Breaking changes
- MINOR: New features
- PATCH: Bug fixes

## Contact & Escalation

### Key Contacts
- Lead Developer: [name]
- DevOps: [name]
- Product Manager: [name]
- On-call Engineer: [rotation]

### Escalation Path
1. Team Slack channel
2. Team lead
3. Manager
4. VP Engineering

## Sign-Off

- [ ] Tech Lead approval
- [ ] Product Manager approval
- [ ] DevOps approval
- [ ] Security review approval

Deployed by: _________________ Date: _________