import { Redirect, Route } from 'react-router-dom';
import { IonRouterOutlet } from '@ionic/react';
import LoginPage from '../features/auth/pages/LoginPage';
import Home from '../pages/Home';
import RoutineListPage from '../features/routines/pages/RoutineListPage';
import RoutineDetailPage from '../features/routines/pages/RoutineDetailPage';
import CreateRoutinePage from '../features/routines/pages/CreateRoutinePage';
import { ProtectedGate, PublicGate } from './SessionGates';
import StudentTrackingPage from '../features/student-tracking/pages/StudentTrackingPage';
import CompanionsPage from '../features/student-tracking/pages/companions-page';
import ActivityHistoryPage from '../features/student-tracking/pages/ActivityHistoryPage';

const AppRoutes: React.FC = () => (
  <IonRouterOutlet>
    <Route exact path="/login" render={() => <PublicGate><LoginPage /></PublicGate>} />
    <Route exact path="/registro" render={() => <PublicGate><LoginPage /></PublicGate>} />
    <Route exact path="/home" render={() => <ProtectedGate><Home /></ProtectedGate>} />
    <Route exact path="/acompanantes" render={() => <ProtectedGate><CompanionsPage /></ProtectedGate>} />
    <Route exact path="/rutinas/nueva" render={() => <ProtectedGate><CreateRoutinePage /></ProtectedGate>} />
    <Route exact path="/rutinas/:routineId([0-9a-fA-F-]{36})" render={() => <ProtectedGate><RoutineDetailPage /></ProtectedGate>} />
    <Route exact path="/rutinas" render={() => <ProtectedGate><RoutineListPage /></ProtectedGate>} />
    <Route exact path="/seguimiento" render={() => <ProtectedGate><StudentTrackingPage /></ProtectedGate>} />
    <Route exact path="/seguimiento/:studentId" render={() => <ProtectedGate><StudentTrackingPage /></ProtectedGate>} />
    <Route exact path="/historial/:studentId" render={() => <ProtectedGate><ActivityHistoryPage /></ProtectedGate>} />
    <Route exact path="/historial" render={() => <ProtectedGate><ActivityHistoryPage /></ProtectedGate>} />
    <Redirect exact from="/" to="/home" />
  </IonRouterOutlet>
);

export default AppRoutes;
