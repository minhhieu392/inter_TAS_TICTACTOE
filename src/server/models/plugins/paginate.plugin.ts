/**
 * @typedef {Object} QueryResult
 * @property {Document[]} results - Results found
 * @property {number} page - Current page
 * @property {number} limit - Maximum number of results per page
 * @property {number} totalPages - Total number of pages
 * @property {number} totalResults - Total number of documents
 */
/**
 * Query for documents with pagination
 * @param {Object} [filter] - Mongo filter
 * @param {Object} [options] - Query options
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */


 export type PaginationTypes = {
    filter?: {
      [key: string]: any
    };
    options?: {
      limit?: string;
      page?: string;
      offset?: string;
      sort?: { [key: string]: number }
    };
    // populates?: Array<string | { path: string, select?: string }>
  }
  
  export type PaginationResponseType = {
    page: number;
    limit: number;
    totalPages: number;
    totalResults: number;
  }
  
  export default async function ({ filter = {}, options = {} }: PaginationTypes): Promise<PaginationResponseType> {
    const limit = options.limit && parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : undefined;
    const page = options.page && parseInt(options.page, 10) > 0 ? parseInt(options.page, 10) : undefined;
    const sort = options?.sort ?? { createdTime: -1 };
    const skip = options.offset ? Number(options.offset) : (limit && page ? (page - 1) * limit : undefined);
    //@ts-ignore
    const countPromise = this.countDocuments(filter).exec();
    //@ts-ignore
    const docsPromise = this.find(filter).sort(sort).skip(skip).limit(limit).exec();
  
    return Promise.all([countPromise, docsPromise]).then((values) => {
      const [totalResults, results] = values;
      const totalPages = Math.ceil(totalResults / limit);
      const result = {
        results,
        page,
        limit,
        totalPages,
        totalResults,
      };
      return Promise.resolve(result);
    });
  }