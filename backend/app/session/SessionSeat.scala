package app.session

sealed trait SessionSeat
object SessionSeat {
  case object Host extends SessionSeat
  case object Guest extends SessionSeat
}
