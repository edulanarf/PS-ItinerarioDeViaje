

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
}

export class Itinerary {
  /**
   * @param name
   */
  constructor(name) {
    this.name = name;
    /**
     * @type {Place[]}
     */
    this.places = [];
  }

  toString() {
    return this.name + ":\n" + this.places.map(p => "\t-" + p.toString()).join('\n')
  }
}

export class FBItinerary {

  /**
   * @typedef FBItineraryContent
   * @property {string[]} names
   * @property {string[]} photos
   * @property {number[]} prices
   * @property {number[]} ratings
   * @property {string[]} addresses
   * @property {string[]} dates
   * @property {string[]} categories
   */

  /**
   * @param {FBItineraryContent} content
   */
  constructor(content) {
    this.names = content.names;
    this.photos = content.photos;
    this.prices = content.prices;
    this.ratings = content.ratings;
    this.addresses = content.addresses;
    this.dates = content.dates;
    this.categories = content.categories;
  }
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
  static fromJson(object){
    return new ItineraryPlan(object.title,object.description,object.photo,[] )
  }

}
