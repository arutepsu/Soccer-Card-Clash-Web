
package views.html

import _root_.play.twirl.api.TwirlFeatureImports.*
import _root_.play.twirl.api.TwirlHelperImports.*
import scala.language.adhocExtensions
import _root_.play.twirl.api.Html
import _root_.play.twirl.api.JavaScript
import _root_.play.twirl.api.Txt
import _root_.play.twirl.api.Xml
import models._
import controllers._
import play.api.i18n._
import views.html._
import play.api.templates.PlayMagic._
import play.api.mvc._
import play.api.data._

object index extends _root_.play.twirl.api.BaseScalaTemplate[play.twirl.api.HtmlFormat.Appendable,_root_.play.twirl.api.Format[play.twirl.api.HtmlFormat.Appendable]](play.twirl.api.HtmlFormat) with _root_.play.twirl.api.Template2[String,play.api.mvc.RequestHeader,play.twirl.api.HtmlFormat.Appendable] {

  /**/
  def apply/*1.2*/(title: String)(implicit rh: play.api.mvc.RequestHeader):play.twirl.api.HtmlFormat.Appendable = {
    _display_ {
      {


Seq[Any](format.raw/*1.58*/("""

"""),_display_(/*3.2*/main(title)/*3.13*/ {_display_(Seq[Any](format.raw/*3.15*/("""
  """),format.raw/*4.3*/("""<h1>"""),_display_(/*4.8*/title),format.raw/*4.13*/("""</h1>
  <pre id="console" class="console">Loading…</pre>
  <div class="row"><span>&gt;</span><input id="in" placeholder="Type a command"/><button id="send">Send</button></div>

  <script>
    // render token into the page
    const CSRF_TOKEN = '"""),_display_(/*10.26*/play/*10.30*/.filters.csrf.CSRF.getToken.map(_.value).getOrElse("")),format.raw/*10.84*/("""';
  </script>
  <script src='"""),_display_(/*12.17*/routes/*12.23*/.Assets.versioned("javascripts/tui.js")),format.raw/*12.62*/("""' defer></script>
""")))}),format.raw/*13.2*/("""
"""))
      }
    }
  }

  def render(title:String,rh:play.api.mvc.RequestHeader): play.twirl.api.HtmlFormat.Appendable = apply(title)(rh)

  def f:((String) => (play.api.mvc.RequestHeader) => play.twirl.api.HtmlFormat.Appendable) = (title) => (rh) => apply(title)(rh)

  def ref: this.type = this

}


              /*
                  -- GENERATED --
                  SOURCE: app/views/index.scala.html
                  HASH: d31eaa1b4fcac4a23c15d4635f7b75cc5e1a754b
                  MATRIX: 794->1|945->57|975->62|994->73|1033->75|1063->79|1093->84|1118->89|1398->342|1411->346|1486->400|1546->433|1561->439|1621->478|1671->498
                  LINES: 22->1|27->1|29->3|29->3|29->3|30->4|30->4|30->4|36->10|36->10|36->10|38->12|38->12|38->12|39->13
                  -- GENERATED --
              */
          