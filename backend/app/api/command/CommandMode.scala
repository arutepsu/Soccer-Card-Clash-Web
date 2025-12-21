package app.api.command

enum CommandMode:
  case local, online

object CommandMode:
  def from(raw: String): CommandMode =
    raw.trim.toLowerCase match
      case "online" => CommandMode.online
      case _        => CommandMode.local
