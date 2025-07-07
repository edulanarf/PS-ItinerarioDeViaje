

export class Place {
  /**
   * @param {string} name
   * @param {string} photo - link for place's photo
   * @param {number} price
   * @param {number} rating
   * @param {string} address
   * @param {string} date - should be Date
   * @param {string} category
   * @param {number} lat - latitude
   * @param {number} lng - longitude
   * @param {string} transport - medio de transporte
   */
  constructor(name,photo,price,rating,address,date,category,lat=undefined,lng=undefined,transport='coche') {
    this.name = name;
    this.photo = photo;
    this.price = price;
    this.rating = rating;
    this.address = address;
    this.date = date;
    this.category = category;
    this.lat = lat;
    this.lng = lng;
    this.transport = transport;
  }

  toString() {
    return this.name + [":",this.category,this.date,this.address].join("\n\t+ ")
  }

  toFirestore() {
    return {
      name: this.name,
      photo: this.photo,
      price: this.price,
      rating: this.rating,
      address: this.address,
      date: this.date,
      category: this.category,
      lat: this.lat,
      lng: this.lng,
      transport: this.transport
    };
  }

}

export class Itinerary {

  /**
   * @param {string} name
   * @param {Place[]}places
   */
  constructor(name, places) {
    this.name = name;
    this.places = places? places : [];
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
  static itineraryConverter = {
    toFirestore: function(itinerary) {
      return itinerary.toFirestore();
    },
    fromFirestore: async function(snapshot, options) {
      const data = snapshot.data(options);
      const places = data.places ? await Promise.all(data.places.map(placeData => new Place(
        placeData.name,
        placeData.photo,
        placeData.price,
        placeData.rating,
        placeData.address,
        placeData.date,
        placeData.category,
        placeData.lat,
        placeData.lng,
        placeData.transport || 'coche'
      ))) : [];
      return new Itinerary(data.name, places)
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
   */
  constructor(title, description, photo,itineraries) {
    this.itineraries = itineraries;
    this._title = title;
    this._description = description;
    this._photo = photo;
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
    }
  }

  // noinspection JSUnusedGlobalSymbols
  static itineraryPlanConverter = {
    toFirestore: function(itineraryPlan) {
      return itineraryPlan.toFirestore();
    },
    fromFirestore: function(snapshot, options) {
      const data = snapshot.data(options);
      return new ItineraryPlan(data.title,data.description,data.photo,[] );
    }
  };
}
