

export class Place {
  /**
   * @param {string} name
   * @param {string} photo - link for place's photo
   * @param {number} price
   * @param {number} rating
   * @param {string} address
   * @param {string} date - should be Date
   * @param {string} category
   * @param lat
   * @param lng
   */
  constructor(
    name,
    photo,
    price,
    rating,
    address,
    date,
    category,
    lat = undefined,
    lng = undefined
  ) {
    this.name = name;
    this.photo = photo;
    this.price = price;
    this.rating = rating;
    this.address = address;
    this.date = date;
    this.category = category;
    this.lat = lat;
    this.lng = lng;
  }

  toString() {
    return (
      this.name + [":", this.category, this.date, this.address].join("\n\t+ ")
    );
  }

  toFirestore() {
    let obj = {
      name: this.name,
      photo: this.photo,
      price: this.price,
      rating: this.rating,
      address: this.address,
      date: this.date,
      category: this.category,
    };
    return this.lat && this.lng ? { ...obj, lat: this.lat, lng: this.lng } : obj;
  }
}

export class Itinerary {

  /**
   * @param {string} name
   * @param {Place[]}places
   */
  constructor(name, places = []) {
    this.name = name;
    /**
     * @type {Place[]}
     */
    this.places = places;

  }

  toString() {
    return this.name + ":\n" + this.places.map(p => "\t-" + p.toString()).join('\n')
  }

  toFirestore() {
    return {
      name: this.name,
      places: this.places.map(p => p.toFirestore())
    };
  }

  // noinspection JSUnusedGlobalSymbols
  static Converter = {
    toFirestore: function(itinerary) {
      return itinerary.toFirestore();
    },
    fromFirestore: async function(snapshot, options) {
      const data = snapshot.data(options);
      return new Itinerary(data.name)
    }
  };
}

export class ItineraryPlan {
  /**
   *
   * @param {string} title
   * @param {string} photo
   * @param {string} description
   * @param {Itinerary[]} itineraries
   * @param {string} id
   * @param {string[]} sharedWith
   */
  constructor(title, description, photo, itineraries, id=NoID, sharedWith = []) {
    this.itineraries = itineraries;
    this._title = title;
    this._description = description;
    this._photo = photo;
    this.id = id;
    this.sharedWith = sharedWith
  }


  get title() {
    return this._title;
  }

  set title(value) {
    this._title = value;
  }

  get description() {
    return this._description;
  }

  set description(value) {
    this._description = value;
  }

  get photo() {
    return this._photo;
  }

  set photo(value) {
    this._photo = value;
  }

  toFirestore() {
    return {
      title: this._title,
      photo: this._photo,
      description: this._description,
      sharedWith: this.sharedWith
    }
  }

  // noinspection JSUnusedGlobalSymbols
  static Converter = {
    toFirestore: function(itineraryPlan) {
      return {
        title: itineraryPlan._title,
        photo: itineraryPlan._photo,
        description: itineraryPlan._description,
        sharedWith: itineraryPlan.sharedWith
      };
    },
    fromFirestore: function(snapshot, options) {
      const data = snapshot.data(options);
      return new ItineraryPlan(data.title, data.description, data.photo, [], snapshot.id, data.sharedWith? data.sharedWith : []);
    }
  };
}

export class UserReference {
  constructor(id=NoID,name) {
    this.id = id;
    this.name = name;
  }
}

export class User extends UserReference{
  /**
   * @param {string} name
   * @param {string} email
   * @param {string} photoURL
   * @param {string} id
   */
  constructor(name,email,photoURL,id) {
    super(id,name)
    this.email = email;
    this.photoURL = photoURL;
  }

  toFirestore() {
    return {
      username: this.name,
      photoURL: this.photoUrl,
      email: this.email,
      id: this.id
    }
  }
  static Converter = {
    toFirestore: function(User) {
      return User.toFirestore();
    },
    fromFirestore: function(snapshot, options) {
      const data = snapshot.data(options);
      console.log("data",data);
      return new User(data.username,data.email,data.photoURL,snapshot.id);
    }
  };
}

export const NoID = "NoID"