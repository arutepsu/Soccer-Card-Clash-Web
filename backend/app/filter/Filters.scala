package app.filter

import javax.inject._
import play.api.http.DefaultHttpFilters
import play.filters.cors.CORSFilter
import play.filters.hosts.AllowedHostsFilter
import play.filters.headers.SecurityHeadersFilter
import play.filters.gzip.GzipFilter

@Singleton
class Filters @Inject() (
  cors: CORSFilter,
  allowedHosts: AllowedHostsFilter,
  securityHeaders: SecurityHeadersFilter,
  gzip: GzipFilter
) extends DefaultHttpFilters(
  cors,
  allowedHosts,
  securityHeaders,
  gzip
)
