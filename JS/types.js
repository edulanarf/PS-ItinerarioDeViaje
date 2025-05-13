

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
    return this.name + [":", this.category, this.date, this.address].join("\n\t+ ")

  }

  static toLi(place){
    return place.name + [":", place.category, place.date, place.address].join("\n\t+ ")
  }

  static toFirestore(place){
    let obj = {
      name: place.name,
      photo: place.photo,
      price: place.price,
      rating: place.rating,
      address: place.address,
      date: place.date,
      category: place.category,
    };
    return place.lat && place.lng ? { ...obj, lat: place.lat, lng: place.lng } : obj;
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

  static toFirestore(itinerary) {
    return {
      name: itinerary.name,
      places: itinerary.places.map(p => Place.toFirestore(p))
    };
  }

  // noinspection JSUnusedGlobalSymbols
  static Converter = {
    toFirestore: function(itinerary) {
      return Itinerary.toFirestore(itinerary);
    },
    fromFirestore: async function(snapshot, options) {
      const data = snapshot.data(options);
      return new Itinerary(data.name, data.places)
    }
  };
}

export class ItineraryPlan {
  /**
   *
   * @param {string} title
   * @param {CloudinaryImage} photo
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

  static toFirestore(plan) {
    return {
      title: plan._title,
      photo: plan._photo,
      description: plan._description,
      sharedWith: plan.sharedWith
    }
  }

  // noinspection JSUnusedGlobalSymbols
  static Converter = {
    toFirestore: function(itineraryPlan) {
      return ItineraryPlan.toFirestore(itineraryPlan);
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
   * @param {CloudinaryImage} image
   * @param {string} id
   */
  constructor(name,email,image,id) {
    super(id,name)
    this.email = email;
    this.photo = image;
  }

  static toFirestore(user) {
    return {
      username: user.name,
      photo: user.photo,
      email: user.email,
      id: user.id
    }
  }

  static Converter = {
    toFirestore: function(user) {
      return User.toFirestore(user);
    },
    fromFirestore: function(snapshot, options) {
      const data = snapshot.data(options);
      console.log("data",data);
      return new User(data.username,data.email,data.photo,snapshot.id);
    }
  };
}

export const NoID = "NoID"


export class CloudinaryImage {
  constructor(secure_url,public_id,folder) {
    this.imageSrc =  secure_url
    this.publicId = public_id
    this.folder =  folder
  }

  /**
   *
   * @param {CloudinaryImage} image
   * @returns {{imageSrc: *, publicId: *}}
   */
  static toFirestore(image) {
    return {
      imageSrc: image.imageSrc,
      publicId: image.publicId,
      folder: image.folder
    }
  }

  static Converter = {
    toFirestore: function(image) {
      return CloudinaryImage.toFirestore(image);
    },
    fromFirestore: function(snapshot, options) {
      const data = snapshot.data(options);
      console.log("data",data);
      return new CloudinaryImage(data.imageSrc,data.publicId,data.folder);
    }
  }
}