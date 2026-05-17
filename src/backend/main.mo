import Array "mo:core/Array";
import Order "mo:core/Order";

actor {
  stable var gamesPlayed : Nat = 0;
  stable var scores : [(Text, Nat)] = [];

  public func incrementGamesPlayed() : async () {
    gamesPlayed += 1;
  };

  public query func getGamesPlayed() : async Nat {
    gamesPlayed;
  };

  public func submitScore(name : Text, score : Nat) : async () {
    // Build new array with the appended entry
    let oldSize = scores.size();
    let updated = Array.tabulate(oldSize + 1, func(i) {
      if (i < oldSize) scores[i] else (name, score)
    });
    // Sort descending by score
    let sorted = updated.sort(func(a : (Text, Nat), b : (Text, Nat)) : Order.Order {
      if (b.1 > a.1) #less
      else if (b.1 < a.1) #greater
      else #equal
    });
    // Keep top 10
    let limit = if (sorted.size() > 10) 10 else sorted.size();
    scores := Array.tabulate<(Text, Nat)>(limit, func(i) { sorted[i] });
  };

  public query func getHighScores() : async [(Text, Nat)] {
    scores;
  };
};
