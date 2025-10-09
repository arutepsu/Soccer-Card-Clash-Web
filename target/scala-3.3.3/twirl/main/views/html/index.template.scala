
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

object index extends _root_.play.twirl.api.BaseScalaTemplate[play.twirl.api.HtmlFormat.Appendable,_root_.play.twirl.api.Format[play.twirl.api.HtmlFormat.Appendable]](play.twirl.api.HtmlFormat) with _root_.play.twirl.api.Template1[String,play.twirl.api.HtmlFormat.Appendable] {

  /**/
  def apply/*1.2*/(title: String):play.twirl.api.HtmlFormat.Appendable = {
    _display_ {
      {


Seq[Any](format.raw/*1.17*/("""

"""),_display_(/*3.2*/main(title)/*3.13*/ {_display_(Seq[Any](format.raw/*3.15*/("""
  """),format.raw/*4.3*/("""<h1>"""),_display_(/*4.8*/title),format.raw/*4.13*/("""</h1>

  <pre id="console" style="height:360px;overflow:auto;border:1px solid #ddd;padding:12px;white-space:pre-wrap">Loading…</pre>

  <div style="display:flex;gap:8px;margin-top:8px;align-items:center">
    <span>&gt;</span>
    <input id="in" style="flex:1" placeholder="Type a command"/>
    <button id="send">Send</button>
  </div>

  <script>
    const $c = document.getElementById('console');
    const $i = document.getElementById('in');
    const hist = []; let idx = -1;

    function setText(t)"""),format.raw/*19.24*/("""{"""),format.raw/*19.25*/(""" """),format.raw/*19.26*/("""$c.textContent = t || ''; $c.scrollTop = $c.scrollHeight; """),format.raw/*19.84*/("""}"""),format.raw/*19.85*/("""

    """),format.raw/*21.5*/("""async function render() """),format.raw/*21.29*/("""{"""),format.raw/*21.30*/("""
      """),format.raw/*22.7*/("""const res = await fetch('/api/state');
      setText(await res.text());
    """),format.raw/*24.5*/("""}"""),format.raw/*24.6*/("""

    """),format.raw/*26.5*/("""async function send(cmd) """),format.raw/*26.30*/("""{"""),format.raw/*26.31*/("""
      """),format.raw/*27.7*/("""const res = await fetch('/api/command', """),format.raw/*27.47*/("""{"""),format.raw/*27.48*/("""
        """),format.raw/*28.9*/("""method: 'POST',
        headers: """),format.raw/*29.18*/("""{"""),format.raw/*29.19*/("""'Content-Type':'application/json'"""),format.raw/*29.52*/("""}"""),format.raw/*29.53*/(""",
        body: JSON.stringify("""),format.raw/*30.30*/("""{"""),format.raw/*30.31*/("""command: cmd"""),format.raw/*30.43*/("""}"""),format.raw/*30.44*/(""")
      """),format.raw/*31.7*/("""}"""),format.raw/*31.8*/(""");
      setText(await res.text());
    """),format.raw/*33.5*/("""}"""),format.raw/*33.6*/("""

    """),format.raw/*35.5*/("""document.getElementById('send').onclick = () => """),format.raw/*35.53*/("""{"""),format.raw/*35.54*/("""
      """),format.raw/*36.7*/("""const v = $i.value.trim(); if(!v) return;
      hist.push(v); idx = hist.length; $i.value = '';
      send(v);
    """),format.raw/*39.5*/("""}"""),format.raw/*39.6*/(""";

    $i.addEventListener('keydown', (e) => """),format.raw/*41.43*/("""{"""),format.raw/*41.44*/("""
      """),format.raw/*42.7*/("""if (e.key === 'Enter') """),format.raw/*42.30*/("""{"""),format.raw/*42.31*/(""" """),format.raw/*42.32*/("""e.preventDefault(); document.getElementById('send').click(); """),format.raw/*42.93*/("""}"""),format.raw/*42.94*/("""
      """),format.raw/*43.7*/("""else if (e.key === 'ArrowUp')   """),format.raw/*43.39*/("""{"""),format.raw/*43.40*/(""" """),format.raw/*43.41*/("""if (hist.length && idx > 0) """),format.raw/*43.69*/("""{"""),format.raw/*43.70*/(""" """),format.raw/*43.71*/("""idx--; $i.value = hist[idx]; """),format.raw/*43.100*/("""}"""),format.raw/*43.101*/(""" """),format.raw/*43.102*/("""}"""),format.raw/*43.103*/("""
      """),format.raw/*44.7*/("""else if (e.key === 'ArrowDown') """),format.raw/*44.39*/("""{"""),format.raw/*44.40*/(""" """),format.raw/*44.41*/("""if (hist.length && idx < hist.length - 1) """),format.raw/*44.83*/("""{"""),format.raw/*44.84*/(""" """),format.raw/*44.85*/("""idx++; $i.value = hist[idx]; """),format.raw/*44.114*/("""}"""),format.raw/*44.115*/(""" """),format.raw/*44.116*/("""else """),format.raw/*44.121*/("""{"""),format.raw/*44.122*/(""" """),format.raw/*44.123*/("""idx = hist.length; $i.value = ''; """),format.raw/*44.157*/("""}"""),format.raw/*44.158*/(""" """),format.raw/*44.159*/("""}"""),format.raw/*44.160*/("""
    """),format.raw/*45.5*/("""}"""),format.raw/*45.6*/(""");

    // live updates (reflect AI/events)
    try """),format.raw/*48.9*/("""{"""),format.raw/*48.10*/("""
      """),format.raw/*49.7*/("""const es = new EventSource('/api/stream');
      es.onmessage = (e) => setText(e.data);
    """),format.raw/*51.5*/("""}"""),format.raw/*51.6*/(""" """),format.raw/*51.7*/("""catch (_) """),format.raw/*51.17*/("""{"""),format.raw/*51.18*/("""}"""),format.raw/*51.19*/("""

    """),format.raw/*53.5*/("""render();
  </script>
""")))}),format.raw/*55.2*/("""
"""))
      }
    }
  }

  def render(title:String): play.twirl.api.HtmlFormat.Appendable = apply(title)

  def f:((String) => play.twirl.api.HtmlFormat.Appendable) = (title) => apply(title)

  def ref: this.type = this

}


              /*
                  -- GENERATED --
                  SOURCE: app/views/index.scala.html
                  HASH: 5b855d0e1a4e94970609f836b74b64693a4a4a47
                  MATRIX: 767->1|877->16|907->21|926->32|965->34|995->38|1025->43|1050->48|1598->568|1627->569|1656->570|1742->628|1771->629|1806->637|1858->661|1887->662|1922->670|2027->748|2055->749|2090->757|2143->782|2172->783|2207->791|2275->831|2304->832|2341->842|2403->876|2432->877|2493->910|2522->911|2582->943|2611->944|2651->956|2680->957|2716->966|2744->967|2813->1009|2841->1010|2876->1018|2952->1066|2981->1067|3016->1075|3161->1193|3189->1194|3264->1241|3293->1242|3328->1250|3379->1273|3408->1274|3437->1275|3526->1336|3555->1337|3590->1345|3650->1377|3679->1378|3708->1379|3764->1407|3793->1408|3822->1409|3880->1438|3910->1439|3940->1440|3970->1441|4005->1449|4065->1481|4094->1482|4123->1483|4193->1525|4222->1526|4251->1527|4309->1556|4339->1557|4369->1558|4403->1563|4433->1564|4463->1565|4526->1599|4556->1600|4586->1601|4616->1602|4649->1608|4677->1609|4759->1664|4788->1665|4823->1673|4944->1767|4972->1768|5000->1769|5038->1779|5067->1780|5096->1781|5131->1789|5186->1814
                  LINES: 22->1|27->1|29->3|29->3|29->3|30->4|30->4|30->4|45->19|45->19|45->19|45->19|45->19|47->21|47->21|47->21|48->22|50->24|50->24|52->26|52->26|52->26|53->27|53->27|53->27|54->28|55->29|55->29|55->29|55->29|56->30|56->30|56->30|56->30|57->31|57->31|59->33|59->33|61->35|61->35|61->35|62->36|65->39|65->39|67->41|67->41|68->42|68->42|68->42|68->42|68->42|68->42|69->43|69->43|69->43|69->43|69->43|69->43|69->43|69->43|69->43|69->43|69->43|70->44|70->44|70->44|70->44|70->44|70->44|70->44|70->44|70->44|70->44|70->44|70->44|70->44|70->44|70->44|70->44|70->44|71->45|71->45|74->48|74->48|75->49|77->51|77->51|77->51|77->51|77->51|77->51|79->53|81->55
                  -- GENERATED --
              */
          