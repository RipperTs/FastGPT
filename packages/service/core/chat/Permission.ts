import axios, {AxiosResponse} from "axios";

interface UserInfoData {
  name: string;
  department: string;
  empNo: string;
  post: string;
  postGrade: string;
  postType: string;
  postLine: string;
  postName: string;
  updateTime: string;
}

interface PermissionData {
  code: number;
  msg: string;
  permission: string;
  token: string;
  username: string;
  role: string;
  permitted: boolean;
  post: UserInfoData;
}

interface ErrorPermission {
  code: number;
  msg: string;
  redirectUrl: string;
}

class Permission {
  // 初始化baseurl参数
  static baseUrl = 'http://localhost:3000';
  // 登录地址
  static loginUrl = 'http://10.6.1.198:8888'

  /**
   * 初始化权限
   * @param baseUrl
   * @param loginUrl
   * @param permission
   */
  static async initPermissions(baseUrl: string,
                               loginUrl: string,
                               permission: string): Promise<PermissionData | ErrorPermission> {
    this.baseUrl = baseUrl;
    this.loginUrl = loginUrl;
    const token = this.getQueryString('token');
    if (!token) {
      return this.noPermission(401, '登录失效，请重新登录~');
    }

    const result: AxiosResponse<PermissionData> = await axios.get(`http://10.6.1.198:8888/shiro/web/authc/isPermitted?permission=${permission}&token=${token}`);
    if (result.status !== 200) {
      console.error("鉴权接口状态不是200");
      return this.noPermission(500, '鉴权失败');
    }
    if (result.data.code !== 200) {
      return this.noPermission(422, result.data.msg);
    }

    if (result.data.permission === 'no') {
      return this.noPermission(401, '您没有权限访问该页面~');
    }

    return result.data;
  }

  /**
   * 获取url中指定的请求参数
   * @param name
   */
  static getQueryString(name: string) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    var r = this.baseUrl.substr(1).match(reg);
    if (r != null) {
      return decodeURI(r[2]);
    }
    return null;
  }


  /**
   * 无权限公共跳转方法
   * @param code
   * @param msg
   */
  static noPermission(code: number, msg: string): ErrorPermission {
    const redirectUrl = `${this.loginUrl}${this.baseUrl}`
    return {code: code, msg: msg, redirectUrl: redirectUrl};
  }

}

export default Permission;
