

export class Place {
  /**
   * @param {string} name
   * @param {string} photo - link for place's photo
   * @param {number} price
   * @param {number} rating
   * @param {string} address
   * @param {string} date - should be Date
   * @param {string} category
   */
  constructor(name,photo,price,rating,address,date,category) {
    this.name = name;
    this.photo = photo;
    this.price = price;
    this.rating = rating;
    this.address = address;
    this.date = date;
    this.category = category;
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
      category: this.category
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
      console.log(data.name, data.places);
      const places = data.places ? await Promise.all(data.places.map(placeData => new Place(
        placeData.name,
        placeData.photo,
        placeData.price,
        placeData.rating,
        placeData.address,
        placeData.date,
        placeData.category
      ))) : [];
      console.log("converted: ", places, Date.now());
      let i = new Itinerary(data.name, places);
      console.log("i", i, Date.now());
      console.log(new Itinerary("hi"));
      return i
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
    this.title = title
    this.description = description
    this.photo = photo
    this.itineraries = itineraries;
  }

  /**
   * @typedef itineraryPlanData
   * @property {string} title
   * @property {string} description
   * @property {string} photo
   */
  /**
   * @param {itineraryPlanData} object
   */
  static from(object){
    return new ItineraryPlan(object.title,object.description,object.photo,[] )
  }

  toFirestore() {
    return {
      title: this.title,
      photo: this.photo,
      description: this.description,
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
